import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ProyectoReceptorEntity } from '../../modules/proyectos/entities/proyecto-receptor.entity';
import { AsignacionUbicacionEntity } from '../../modules/ubicacion/entities/asignacion-ubicacion.entity';
import { HistorialReasignacionEntity } from '../../modules/ubicacion/entities/historial-reasignacion.entity';
import { NotificacionMovimientoEntity } from '../../modules/ubicacion/entities/notificacion-movimiento.entity';
import { PROYECTOS_RECEPTORES_SEED } from './proyectos-receptores.data';

dotenv.config();

export async function runProyectosSeed(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(ProyectoReceptorEntity);

  for (const item of PROYECTOS_RECEPTORES_SEED) {
    const existe = await repository.findOne({
      where: { nombre_proyecto: item.nombre_proyecto },
    });

    if (!existe) {
      const nuevo = repository.create({
        ...item,
        monto_pasaje_fijo: Number(item.monto_pasaje_fijo),
        activo: true,
      });
      await repository.save(nuevo);
    } else {
      existe.monto_pasaje_fijo = Number(item.monto_pasaje_fijo);
      existe.cupo_maximo_voluntarios = item.cupo_maximo_voluntarios;
      existe.direccion_exacta = item.direccion_exacta;
      existe.macrodistrito_zona = item.macrodistrito_zona;
      existe.nombre_supervisor_centro = item.nombre_supervisor_centro;
      existe.telefono_contacto = item.telefono_contacto;
      existe.correo = item.correo;
      existe.poblacion_objetivo = item.poblacion_objetivo;
      existe.actividades_semestre_actual = item.actividades_semestre_actual;
      await repository.save(existe);
    }
  }
}

async function execute() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'catovoluntarios_db',
    entities: [
      ProyectoReceptorEntity,
      AsignacionUbicacionEntity,
      HistorialReasignacionEntity,
      NotificacionMovimientoEntity,
    ],
    synchronize: true,
    ssl:
      process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await dataSource.initialize();
    await runProyectosSeed(dataSource);
    await dataSource.destroy();
  } catch (error) {
    console.error('Error al ejecutar seed de proyectos:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  execute();
}
