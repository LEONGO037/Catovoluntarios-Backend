import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  EstadoAsistencia,
  RegistroAsistenciaEntity,
  TipoActividadAsistencia,
} from './entities/registro-asistencia.entity';
import { ConciliacionMensualEntity } from './entities/conciliacion-mensual.entity';
import { LiquidacionPasajeEntity } from './entities/liquidacion-pasaje.entity';
import { ESTADOS_VALIDADOS, nombreCompleto } from './asistencia.service';
import { MESES, montoEnLetras, rangoMes } from './utils/calculos.util';

export interface FilaPlanilla {
  asignacionId: number;
  voluntarioId: number;
  nombre: string;
  ci: string;
  carrera: string;
  celular: string;
  condicion: string;
  dias: number;
  fechas: string[];
  horasPresenciales: number;
  horasNoPresenciales: number;
  tarifa: number;
  monto: number;
  estadoPago: string | null;
}

export interface HojaIndividual {
  asignacionId: number;
  proyecto: { id: number; nombre: string; supervisor: string; catolider: string | null };
  estado: 'CONCILIADO' | 'PRELIMINAR';
  estadoPago: string | null;
  jornadas: { numero: number; fecha: string; horaIngreso: string; horaSalida: string; horas: number; pasaje: number }[];
  horasNoPresenciales: number;
  totalHoras: number;
  dias: number;
  tarifa: number;
  monto: number;
  montoEnLetras: string;
}

/**
 * P-17: planillas contables de reposición de pasajes.
 * Monto = días presenciales validados × tarifa fija del proyecto receptor (RF-17).
 * Si el mes está conciliado se usa la liquidación guardada (inmutable, RNF-06);
 * si no, se muestra un cálculo preliminar con lo aprobado por el Catolíder.
 */
@Injectable()
export class PasajesService {
  constructor(
    @InjectRepository(ProyectoReceptorEntity)
    private readonly proyectos: Repository<ProyectoReceptorEntity>,
    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignaciones: Repository<AsignacionUbicacionEntity>,
    @InjectRepository(RegistroAsistenciaEntity)
    private readonly registros: Repository<RegistroAsistenciaEntity>,
    @InjectRepository(UserEntity)
    private readonly usuarios: Repository<UserEntity>,
    @InjectRepository(ConciliacionMensualEntity)
    private readonly conciliaciones: Repository<ConciliacionMensualEntity>,
    @InjectRepository(LiquidacionPasajeEntity)
    private readonly liquidaciones: Repository<LiquidacionPasajeEntity>,
  ) {}

  async planillaMacro(proyectoId: number, mes: number, anio: number) {
    const proyecto = await this.proyectos.findOne({ where: { id: proyectoId } });
    if (!proyecto) throw new NotFoundException('Proyecto receptor no encontrado');

    const asignaciones = await this.asignaciones.find({
      where: { idProyecto: proyectoId },
      relations: { usuario: true },
    });
    const ids = asignaciones.map((a) => a.id);
    const { desde, hasta } = rangoMes(mes, anio);
    const registros = ids.length
      ? await this.registros
          .createQueryBuilder('r')
          .where('r.idAsignacion IN (:...ids)', { ids })
          .andWhere('r.fecha BETWEEN :desde AND :hasta', { desde, hasta })
          .orderBy('r.fecha', 'ASC')
          .getMany()
      : [];

    const conciliacion = await this.conciliaciones.findOne({ where: { proyectoId, mes, anio } });
    const liquidaciones = conciliacion
      ? await this.liquidaciones.find({ where: { idConciliacion: conciliacion.id } })
      : [];
    const liqPorAsignacion = new Map(liquidaciones.map((l) => [l.idAsignacion, l]));
    const tarifaProyecto = Number(proyecto.monto_pasaje_por_dia);

    const filas: FilaPlanilla[] = [];
    for (const a of asignaciones) {
      const validos = registros.filter(
        (r) => r.idAsignacion === a.id && ESTADOS_VALIDADOS.includes(r.estadoAprobacion),
      );
      const liq = liqPorAsignacion.get(a.id);
      if (!liq && validos.length === 0) continue;

      const fechas = [...new Set(validos.filter((r) => r.generaPasaje).map((r) => r.fecha))].sort();
      const tarifa = liq ? Number(liq.tarifaDiariaAplicada) : tarifaProyecto;
      const dias = liq ? liq.diasPresencialesAsistidos : fechas.length;
      filas.push({
        asignacionId: a.id,
        voluntarioId: a.idUsuario,
        nombre: nombreCompleto(a.usuario),
        ci: a.usuario?.ci ?? '',
        carrera: a.usuario?.carrera ?? '',
        celular: a.usuario?.telefono ?? '',
        condicion: a.condicion,
        dias,
        fechas,
        horasPresenciales: this.r2(
          validos
            .filter((r) => r.tipoActividad === TipoActividadAsistencia.PRESENCIAL)
            .reduce((s, r) => s + Number(r.horasCalculadas), 0),
        ),
        horasNoPresenciales: this.r2(
          validos
            .filter((r) => r.tipoActividad !== TipoActividadAsistencia.PRESENCIAL)
            .reduce((s, r) => s + Number(r.horasCalculadas), 0),
        ),
        tarifa,
        monto: liq ? Number(liq.montoTotalReponer) : dias * tarifa,
        estadoPago: liq?.estadoPago ?? null,
      });
    }
    filas.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));

    const catolider = proyecto.catolider_titular_id
      ? await this.usuarios.findOne({ where: { id: proyecto.catolider_titular_id } })
      : null;

    return {
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre_proyecto,
        zona: proyecto.macrodistrito_zona,
        direccion: proyecto.direccion_exacta,
        supervisor: proyecto.supervisor_nombre,
        catolider: catolider ? nombreCompleto(catolider) : null,
        tarifaPasaje: tarifaProyecto,
      },
      mes,
      anio,
      mesNombre: MESES[mes - 1],
      estado: conciliacion ? 'CONCILIADO' : 'PRELIMINAR',
      conciliacion: conciliacion
        ? { id: conciliacion.id, fecha: conciliacion.fechaConciliacion, reporteUrl: conciliacion.reporteFirmasSupervisorUrl ?? null }
        : null,
      pendientesRevision: registros.filter((r) => r.estadoAprobacion === EstadoAsistencia.REGISTRADO).length,
      filas,
      totales: {
        voluntarios: filas.length,
        dias: filas.reduce((s, f) => s + f.dias, 0),
        horasPresenciales: this.r2(filas.reduce((s, f) => s + f.horasPresenciales, 0)),
        monto: this.r2(filas.reduce((s, f) => s + f.monto, 0)),
        montoEnLetras: montoEnLetras(filas.reduce((s, f) => s + f.monto, 0)),
      },
    };
  }

  /** Planilla 'Recibí Conforme' de un voluntario para firma física (P-17). */
  async planillaIndividual(voluntarioId: number, mes: number, anio: number, proyectoId?: number) {
    const usuario = await this.usuarios.findOne({ where: { id: voluntarioId } });
    if (!usuario) throw new NotFoundException('Voluntario no encontrado');

    const asignaciones = await this.asignaciones.find({
      where: proyectoId ? { idUsuario: voluntarioId, idProyecto: proyectoId } : { idUsuario: voluntarioId },
      relations: { proyecto: true },
      order: { createdAt: 'DESC' },
    });
    if (asignaciones.length === 0) {
      throw new NotFoundException('El voluntario no tiene asignaciones a proyectos receptores');
    }

    const { desde, hasta } = rangoMes(mes, anio);
    const registros = await this.registros
      .createQueryBuilder('r')
      .where('r.idAsignacion IN (:...ids)', { ids: asignaciones.map((a) => a.id) })
      .andWhere('r.fecha BETWEEN :desde AND :hasta', { desde, hasta })
      .andWhere('r.estadoAprobacion IN (:...estados)', { estados: ESTADOS_VALIDADOS })
      .orderBy('r.fecha', 'ASC')
      .addOrderBy('r.horaIngreso', 'ASC')
      .getMany();

    // Una hoja por proyecto en el que tuvo actividad ese mes (si fue reasignado, salen dos)
    const hojas: HojaIndividual[] = [];
    for (const a of asignaciones) {
      const propios = registros.filter((r) => r.idAsignacion === a.id);
      if (propios.length === 0 && asignaciones.length > 1) continue;
      const liq = await this.liquidaciones.findOne({ where: { idAsignacion: a.id, mes, anio } });
      const tarifa = liq ? Number(liq.tarifaDiariaAplicada) : Number(a.proyecto?.monto_pasaje_por_dia ?? 0);
      const presenciales = propios.filter((r) => r.generaPasaje);
      const dias = liq ? liq.diasPresencialesAsistidos : new Set(presenciales.map((r) => r.fecha)).size;
      const monto = liq ? Number(liq.montoTotalReponer) : dias * tarifa;
      const catolider = a.proyecto?.catolider_titular_id
        ? await this.usuarios.findOne({ where: { id: a.proyecto.catolider_titular_id } })
        : null;

      hojas.push({
        asignacionId: a.id,
        proyecto: {
          id: a.idProyecto,
          nombre: a.proyecto?.nombre_proyecto ?? '',
          supervisor: a.proyecto?.supervisor_nombre ?? '',
          catolider: catolider ? nombreCompleto(catolider) : null,
        },
        estado: liq ? 'CONCILIADO' : 'PRELIMINAR',
        estadoPago: liq?.estadoPago ?? null,
        jornadas: presenciales.map((r, i) => ({
          numero: i + 1,
          fecha: r.fecha,
          horaIngreso: r.horaIngreso.slice(0, 5),
          horaSalida: r.horaSalida.slice(0, 5),
          horas: Number(r.horasCalculadas),
          pasaje: tarifa,
        })),
        horasNoPresenciales: this.r2(
          propios.filter((r) => !r.generaPasaje).reduce((s, r) => s + Number(r.horasCalculadas), 0),
        ),
        totalHoras: this.r2(presenciales.reduce((s, r) => s + Number(r.horasCalculadas), 0)),
        dias,
        tarifa,
        monto,
        montoEnLetras: montoEnLetras(monto),
      });
    }

    return {
      voluntario: {
        id: usuario.id,
        nombre: nombreCompleto(usuario),
        ci: usuario.ci,
        carrera: usuario.carrera ?? '',
      },
      mes,
      anio,
      mesNombre: MESES[mes - 1],
      hojas,
    };
  }

  /** Resumen del mes por proyecto para el selector de P-17. */
  async resumenMes(mes: number, anio: number) {
    const proyectos = await this.proyectos.find({ order: { nombre_proyecto: 'ASC' } });
    const { desde, hasta } = rangoMes(mes, anio);
    const conciliaciones = await this.conciliaciones.find({ where: { mes, anio } });
    const concPorProyecto = new Map(conciliaciones.map((c) => [c.proyectoId, c]));

    const filas: {
      id_proyecto: number;
      id_asignacion: number;
      fecha: string;
      estado: EstadoAsistencia;
      genera: boolean;
    }[] = await this.registros
      .createQueryBuilder('r')
      .innerJoin('r.asignacion', 'a')
      .select('a.idProyecto', 'id_proyecto')
      .addSelect('r.idAsignacion', 'id_asignacion')
      .addSelect('r.fecha', 'fecha')
      .addSelect('r.estadoAprobacion', 'estado')
      .addSelect('r.generaPasaje', 'genera')
      .where('r.fecha BETWEEN :desde AND :hasta', { desde, hasta })
      .getRawMany();

    const resultado = proyectos.map((p) => {
      const propias = filas.filter((f) => Number(f.id_proyecto) === p.id);
      const conc = concPorProyecto.get(p.id);
      const validas = propias.filter((f) => ESTADOS_VALIDADOS.includes(f.estado) && f.genera);
      const diasPorAsignacion = new Map<number, Set<string>>();
      validas.forEach((f) => {
        const set = diasPorAsignacion.get(Number(f.id_asignacion)) ?? new Set<string>();
        set.add(String(f.fecha));
        diasPorAsignacion.set(Number(f.id_asignacion), set);
      });
      const dias = [...diasPorAsignacion.values()].reduce((s, set) => s + set.size, 0);
      const tarifa = Number(p.monto_pasaje_por_dia);
      return {
        proyectoId: p.id,
        nombre: p.nombre_proyecto,
        tarifaPasaje: tarifa,
        voluntarios: diasPorAsignacion.size,
        dias: conc ? conc.totalDiasAsistidos : dias,
        monto: conc ? Number(conc.montoTotalPasajes) : dias * tarifa,
        pendientesRevision: propias.filter((f) => f.estado === EstadoAsistencia.REGISTRADO).length,
        conciliado: Boolean(conc),
      };
    });

    return {
      mes,
      anio,
      mesNombre: MESES[mes - 1],
      proyectos: resultado,
      totales: {
        dias: resultado.reduce((s, r) => s + r.dias, 0),
        monto: resultado.reduce((s, r) => s + r.monto, 0),
        proyectosConciliados: resultado.filter((r) => r.conciliado).length,
      },
    };
  }

  /** Marca una liquidación como firmada o desembolsada. */
  async actualizarEstadoPago(asignacionIds: number[], mes: number, anio: number, estado: LiquidacionPasajeEntity['estadoPago']) {
    const liqs = await this.liquidaciones.find({ where: { idAsignacion: In(asignacionIds), mes, anio } });
    if (liqs.length === 0) throw new NotFoundException('No hay liquidaciones conciliadas para actualizar');
    liqs.forEach((l) => {
      l.estadoPago = estado;
    });
    await this.liquidaciones.save(liqs);
    return { actualizadas: liqs.length };
  }

  private r2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
