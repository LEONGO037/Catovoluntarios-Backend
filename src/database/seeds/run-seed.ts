import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import dataSource from '../data-source';
import { ProyectoReceptorEntity } from '../../modules/proyectos/entities/proyecto-receptor.entity';
import { PROYECTOS_RECEPTORES_SEED } from './proyectos-receptores.data';

dotenv.config();

export async function runProyectosSeed(ds: DataSource): Promise<void> {
  const repository = ds.getRepository(ProyectoReceptorEntity);
  const userRows: { id: number }[] = await ds.query('SELECT id FROM usuarios');
  const validUserIds = new Set(userRows.map((u) => u.id));

  for (const item of PROYECTOS_RECEPTORES_SEED) {
    const titularId =
      item.catolider_titular_id && validUserIds.has(item.catolider_titular_id)
        ? item.catolider_titular_id
        : null;
    const aprendizId =
      item.catolider_aprendiz_id && validUserIds.has(item.catolider_aprendiz_id)
        ? item.catolider_aprendiz_id
        : null;

    const existe = await repository.findOne({
      where: { nombre_proyecto: item.nombre_proyecto },
    });

    if (!existe) {
      const nuevo = repository.create({
        ...item,
        catolider_titular_id: titularId,
        catolider_aprendiz_id: aprendizId,
        supervisor_nombre: item.nombre_supervisor_centro,
        supervisor_telefono: item.telefono_contacto,
        monto_pasaje_por_dia: Number(item.monto_pasaje_fijo),
        cupo_maximo: item.cupo_maximo_voluntarios,
        activo: true,
      });
      await repository.save(nuevo);
    } else {
      existe.catolider_titular_id = titularId;
      existe.catolider_aprendiz_id = aprendizId;
      existe.supervisor_nombre = item.nombre_supervisor_centro;
      existe.supervisor_telefono = item.telefono_contacto;
      existe.monto_pasaje_por_dia = Number(item.monto_pasaje_fijo);
      existe.cupo_maximo = item.cupo_maximo_voluntarios;
      existe.direccion_exacta = item.direccion_exacta;
      existe.macrodistrito_zona = item.macrodistrito_zona;
      existe.correo = item.correo;
      existe.poblacion_objetivo = item.poblacion_objetivo;
      existe.actividades_semestre_actual = item.actividades_semestre_actual;
      await repository.save(existe);
    }
  }
}

async function execute() {
  try {
    await dataSource.initialize();
    await runProyectosSeed(dataSource);
    console.log('Seed de proyectos ejecutado exitosamente.');
    await dataSource.destroy();
  } catch (error) {
    console.error('Error al ejecutar seed de proyectos:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  execute();
}
