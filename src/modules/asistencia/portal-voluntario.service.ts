import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RequestUser } from '../../common/decorators/get-user.decorator';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import {
  DocumentoVoluntarioEntity,
  TipoDocumento,
} from '../documentos/entities/documento-voluntario.entity';
import { RegistroAsistenciaEntity, TipoActividadAsistencia } from './entities/registro-asistencia.entity';
import { LiquidacionPasajeEntity } from './entities/liquidacion-pasaje.entity';
import { AsistenciaService, ESTADOS_QUE_SUMAN, ESTADOS_VALIDADOS, nombreCompleto } from './asistencia.service';
import {
  calcularNivel,
  fechaLocalISO,
  horasParaSiguienteNivel,
  mensajeMotivacional,
  MESES,
} from './utils/calculos.util';

/** P-18: vista personal del Catovoluntario. */
@Injectable()
export class PortalVoluntarioService {
  private readonly metaSemestre: number;

  constructor(
    config: ConfigService,
    private readonly asistencia: AsistenciaService,
    @InjectRepository(UserEntity)
    private readonly usuarios: Repository<UserEntity>,
    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignaciones: Repository<AsignacionUbicacionEntity>,
    @InjectRepository(RegistroAsistenciaEntity)
    private readonly registros: Repository<RegistroAsistenciaEntity>,
    @InjectRepository(DocumentoVoluntarioEntity)
    private readonly documentos: Repository<DocumentoVoluntarioEntity>,
    @InjectRepository(LiquidacionPasajeEntity)
    private readonly liquidaciones: Repository<LiquidacionPasajeEntity>,
  ) {
    this.metaSemestre = Number(config.get<string>('MIN_HOURS_SEMESTER')) || 40;
  }

  async resumen(user: RequestUser) {
    const usuario = await this.usuarios.findOne({ where: { id: user.id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const asignacion = await this.asistencia.asignacionActiva(user.id);
    const todas = await this.asignaciones.find({ where: { idUsuario: user.id }, relations: { proyecto: true } });
    const idsTodas = todas.map((a) => a.id);

    const registros = idsTodas.length
      ? await this.registros.find({
          where: { idAsignacion: In(idsTodas) },
          relations: { actividadEmergente: true, asignacion: { proyecto: true } },
          order: { fecha: 'DESC', horaIngreso: 'DESC' },
        })
      : [];
    const suman = registros.filter((r) => ESTADOS_QUE_SUMAN.includes(r.estadoAprobacion));

    // Horas del semestre de la asignación vigente (o de la última, si ya no tiene una activa)
    const semestre = asignacion?.semestre ?? todas[0]?.semestre ?? null;
    const idsSemestre = new Set(todas.filter((a) => a.semestre === semestre).map((a) => a.id));
    const delSemestre = suman.filter((r) => idsSemestre.has(r.idAsignacion));
    const horasDe = (lista: RegistroAsistenciaEntity[], tipo?: TipoActividadAsistencia) =>
      this.r2(lista.filter((r) => !tipo || r.tipoActividad === tipo).reduce((s, r) => s + Number(r.horasCalculadas), 0));

    const horasSemestre = horasDe(delSemestre);
    const horasHistoricas = horasDe(suman);
    const nivel = calcularNivel(horasHistoricas);

    // Semana actual (lunes a domingo)
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const desdeSemana = fechaLocalISO(lunes);
    const horasSemana = horasDe(delSemestre.filter((r) => r.fecha >= desdeSemana));

    // Póliza (último documento de póliza cargado)
    const poliza = await this.documentos.findOne({
      where: { userId: user.id, tipoDocumento: TipoDocumento.POLIZA_ACCIDENTES_APC7083 },
      order: { createdAt: 'DESC' },
    });

    const proyecto = asignacion?.proyecto ?? null;
    const [titular, aprendiz] = await Promise.all([
      proyecto?.catolider_titular_id ? this.usuarios.findOne({ where: { id: proyecto.catolider_titular_id } }) : null,
      proyecto?.catolider_aprendiz_id ? this.usuarios.findOne({ where: { id: proyecto.catolider_aprendiz_id } }) : null,
    ]);

    return {
      voluntario: {
        id: usuario.id,
        nombre: nombreCompleto(usuario),
        nombres: usuario.nombres,
        ci: usuario.ci,
        carrera: usuario.carrera ?? '',
      },
      mensaje: mensajeMotivacional(usuario.nombres.split(' ')[0], horasSemestre, this.metaSemestre),
      asignacion: asignacion
        ? {
            id: asignacion.id,
            semestre: asignacion.semestre,
            condicion: asignacion.condicion,
            horario: asignacion.horario_comprometido,
            polizaValidada: asignacion.polizaValidada,
            induccionCompletada: asignacion.induccionCompletada,
            habilitadoCampo: asignacion.habilitadoCampo,
          }
        : null,
      proyecto: proyecto
        ? {
            id: proyecto.id,
            nombre: proyecto.nombre_proyecto,
            direccion: proyecto.direccion_exacta,
            zona: proyecto.macrodistrito_zona,
            poblacion: proyecto.poblacion_objetivo,
            actividades: proyecto.actividades_semestre_actual,
            supervisor: proyecto.supervisor_nombre,
            supervisorTelefono: proyecto.supervisor_telefono,
            tarifaPasaje: Number(proyecto.monto_pasaje_por_dia),
          }
        : null,
      catolider: titular ? { nombre: nombreCompleto(titular), celular: titular.telefono ?? '' } : null,
      catoliderAprendiz: aprendiz ? { nombre: nombreCompleto(aprendiz), celular: aprendiz.telefono ?? '' } : null,
      poliza: poliza
        ? {
            numero: poliza.numeroPoliza ?? null,
            vigenciaInicio: poliza.vigenciaInicio ?? null,
            vigenciaFin: poliza.vigenciaFin ?? null,
            estado: poliza.estado,
          }
        : null,
      horas: {
        semestre,
        meta: this.metaSemestre,
        total: horasSemestre,
        presenciales: horasDe(delSemestre, TipoActividadAsistencia.PRESENCIAL),
        noPresenciales: horasDe(delSemestre, TipoActividadAsistencia.NO_PRESENCIAL),
        emergentes: horasDe(delSemestre, TipoActividadAsistencia.EMERGENTE),
        validadas: horasDe(delSemestre.filter((r) => ESTADOS_VALIDADOS.includes(r.estadoAprobacion))),
        semanaActual: horasSemana,
        metaSemanal: 4,
        porcentaje: Math.min(100, Math.round((horasSemestre / this.metaSemestre) * 100)),
      },
      nivel: {
        actual: nivel,
        horasHistoricas,
        faltanParaSiguiente: horasParaSiguienteNivel(horasHistoricas),
      },
      asistenciasRecientes: registros.slice(0, 8).map((r) => this.asistencia.vista(r)),
      pasajes: await this.pasajesPorMes(registros, todas),
    };
  }

  private async pasajesPorMes(registros: RegistroAsistenciaEntity[], asignaciones: AsignacionUbicacionEntity[]) {
    const tarifas = new Map(asignaciones.map((a) => [a.id, Number(a.proyecto?.monto_pasaje_por_dia ?? 0)]));
    const liqs = asignaciones.length
      ? await this.liquidaciones.find({ where: { idAsignacion: In(asignaciones.map((a) => a.id)) } })
      : [];
    const grupos = new Map<string, { mes: number; anio: number; dias: Set<string>; monto: number; asignaciones: Set<number> }>();

    registros
      .filter((r) => r.generaPasaje && ESTADOS_VALIDADOS.includes(r.estadoAprobacion))
      .forEach((r) => {
        const [anio, mes] = r.fecha.split('-').map((n) => parseInt(n, 10));
        const clave = `${anio}-${mes}`;
        const g = grupos.get(clave) ?? { mes, anio, dias: new Set<string>(), monto: 0, asignaciones: new Set<number>() };
        const claveDia = `${r.idAsignacion}|${r.fecha}`;
        if (!g.dias.has(claveDia)) {
          g.dias.add(claveDia);
          g.monto += tarifas.get(r.idAsignacion) ?? 0;
        }
        g.asignaciones.add(r.idAsignacion);
        grupos.set(clave, g);
      });

    return [...grupos.values()]
      .sort((a, b) => b.anio - a.anio || b.mes - a.mes)
      .map((g) => {
        const liq = liqs.filter((l) => l.mes === g.mes && l.anio === g.anio);
        const conciliado = liq.length > 0;
        return {
          mes: g.mes,
          anio: g.anio,
          mesNombre: MESES[g.mes - 1],
          dias: conciliado ? liq.reduce((s, l) => s + l.diasPresencialesAsistidos, 0) : g.dias.size,
          monto: conciliado ? liq.reduce((s, l) => s + Number(l.montoTotalReponer), 0) : g.monto,
          estado: conciliado ? liq[0].estadoPago : 'EN_REVISION',
        };
      });
  }

  private r2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
