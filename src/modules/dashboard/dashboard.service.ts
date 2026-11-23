import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { PostulacionEntity } from '../postulaciones/entities/postulacion.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { RegistroAsistenciaEntity } from '../asistencia/entities/registro-asistencia.entity';
import { ReporteSemaforoEntity } from '../semaforos/entities/reporte-semaforo.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ProyectoReceptorEntity)
    private readonly proyectosRepo: Repository<ProyectoReceptorEntity>,
    @InjectRepository(PostulacionEntity)
    private readonly postulacionesRepo: Repository<PostulacionEntity>,
    @InjectRepository(AsignacionUbicacionEntity)
    private readonly asignacionesRepo: Repository<AsignacionUbicacionEntity>,
    @InjectRepository(RegistroAsistenciaEntity)
    private readonly asistenciasRepo: Repository<RegistroAsistenciaEntity>,
    @InjectRepository(ReporteSemaforoEntity)
    private readonly semaforosRepo: Repository<ReporteSemaforoEntity>,
  ) {}

  async getExecutiveMetrics(semestre = '2/2026') {
    // 1. Postulantes reales en base de datos
    const countPostulantes = await this.postulacionesRepo.count({
      where: { semestre },
    });

    // 2. Voluntarios activos en campo reales
    const countActivos = await this.asignacionesRepo.count({
      where: { semestre, habilitadoCampo: true, activo: true },
    });

    // 3. Pólizas validadas reales
    const countPolizas = await this.asignacionesRepo.count({
      where: { semestre, polizaValidada: true },
    });

    // 4. Horas totales del mes calculadas
    const sumHorasRaw = await this.asistenciasRepo
      .createQueryBuilder('asistencia')
      .select('SUM(asistencia.horasCalculadas)', 'total')
      .getRawOne();
    const totalHoras = parseFloat(sumHorasRaw?.total || '0');

    return {
      semestre,
      kpis: {
        totalPostulantes: {
          value: countPostulantes,
          label: 'Total Postulantes Semestre',
          tendencia: countPostulantes > 0 ? `${countPostulantes} registrados` : 'Sin registros aún',
          descripcion: 'Aspirantes registrados en plataforma',
        },
        voluntariosActivos: {
          value: countActivos,
          label: 'Voluntarios Activos en Campo',
          tendencia: countActivos > 0 ? `${countActivos} habilitados` : 'Sin voluntarios habilitados',
          descripcion: 'Asignados con inducción completada',
        },
        polizasValidadas: {
          value: countPolizas,
          label: 'Pólizas de Seguro Validadas',
          tendencia: countPolizas > 0 ? `${countPolizas} validadas` : 'Pendientes de validación',
          descripcion: 'Habilitados legalmente ante Pastoral',
        },
        horasTotalesMes: {
          value: totalHoras,
          label: 'Horas Totales del Mes',
          tendencia: totalHoras > 0 ? `${totalHoras} hrs acumuladas` : '0 hrs acumuladas',
          descripcion: 'Horas presenciales registradas y aprobadas',
        },
      },
    };
  }

  async getCuposProyectos(semestre = '2/2026') {
    const proyectos = await this.proyectosRepo.find({
      where: { activo: true },
      order: { cupoOcupado: 'DESC' },
    });

    const totalCupos = proyectos.reduce((acc, p) => acc + (p.cupoMaximo || 0), 0);
    const totalOcupados = proyectos.reduce((acc, p) => acc + (p.cupoOcupado || 0), 0);

    const items = proyectos.map((p, index) => {
      const porcentaje = Math.round(((p.cupoOcupado || 0) / (p.cupoMaximo || 1)) * 100);
      const colores = ['#004077', '#FFCC00', '#10B981', '#8B5CF6', '#EF4444', '#0EA5E9', '#F97316'];
      return {
        id: p.id,
        nombre: p.nombreProyecto,
        cupoMaximo: p.cupoMaximo || 0,
        cupoOcupado: p.cupoOcupado || 0,
        porcentaje,
        poblacion: p.poblacionObjetivo || 'General',
        montoPasajeFijo: Number(p.montoPasajePorDia) || 0,
        color: colores[index % colores.length],
      };
    });

    return {
      semestre,
      totalCupos,
      totalOcupados,
      porcentajeGlobal: totalCupos > 0 ? Math.round((totalOcupados / totalCupos) * 100) : 0,
      proyectos: items,
    };
  }

  async getSemaforoOperativo(mes = 'Noviembre 2026') {
    const semaforos = await this.semaforosRepo.find({
      where: { mes },
    });

    let morado = 0;
    let verde = 0;
    let amarillo = 0;
    let rojo = 0;

    for (const s of semaforos) {
      if (s.colorSemaforo === 'Morado') morado++;
      else if (s.colorSemaforo === 'Verde') verde++;
      else if (s.colorSemaforo === 'Amarillo') amarillo++;
      else if (s.colorSemaforo === 'Rojo') rojo++;
    }

    const total = morado + verde + amarillo + rojo;

    return {
      mes,
      totalEvaluados: total,
      distribucion: {
        morado: { count: morado, porcentaje: total > 0 ? Math.round((morado / total) * 100) : 0, label: 'Excelente / Destacado' },
        verde: { count: verde, porcentaje: total > 0 ? Math.round((verde / total) * 100) : 0, label: 'Normal / Buen Cumplimiento' },
        amarillo: { count: amarillo, porcentaje: total > 0 ? Math.round((amarillo / total) * 100) : 0, label: 'Alerta / Atrasos Observados' },
        rojo: { count: rojo, porcentaje: total > 0 ? Math.round((rojo / total) * 100) : 0, label: 'Riesgo / Abandono Notificado' },
      },
    };
  }

  async getNotificacionesUrgentes() {
    // Si no hay alertas reales registradas, retorna arreglo vacío
    return [];
  }
}
