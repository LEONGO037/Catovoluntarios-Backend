import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import dataSource from '../data-source';
import { InstitucionEntity } from '../../modules/proyectos/entities/institucion.entity';
import { ProyectoReceptorEntity } from '../../modules/proyectos/entities/proyecto-receptor.entity';
import { PROYECTOS_RECEPTORES_SEED } from './proyectos-receptores.data';

dotenv.config();

export async function runProyectosSeed(ds: DataSource): Promise<void> {
  const institucionRepo = ds.getRepository(InstitucionEntity);
  const proyectoRepo = ds.getRepository(ProyectoReceptorEntity);
  const userRows: { id: number }[] = await ds.query('SELECT id FROM usuarios');
  const validUserIds = new Set(userRows.map((u) => u.id));

  for (const item of PROYECTOS_RECEPTORES_SEED) {
    let institucion = await institucionRepo.findOne({
      where: { nombre: item.institucion_nombre },
    });

    if (!institucion) {
      institucion = institucionRepo.create({
        nombre: item.institucion_nombre,
        direccion_exacta: item.direccion_exacta,
        macrodistrito_zona: item.macrodistrito_zona,
        nombre_supervisor_centro: item.nombre_supervisor_centro,
        telefono_contacto: item.telefono_contacto,
        correo: item.correo,
        fecha_inicio_convenio: item.fecha_inicio_convenio,
        fecha_fin_convenio: item.fecha_fin_convenio,
        activo: true,
      });
      institucion = await institucionRepo.save(institucion);
    } else {
      institucion.direccion_exacta = item.direccion_exacta;
      institucion.macrodistrito_zona = item.macrodistrito_zona;
      institucion.nombre_supervisor_centro = item.nombre_supervisor_centro;
      institucion.telefono_contacto = item.telefono_contacto;
      institucion.correo = item.correo;
      institucion.fecha_inicio_convenio = item.fecha_inicio_convenio;
      institucion.fecha_fin_convenio = item.fecha_fin_convenio;
      institucion = await institucionRepo.save(institucion);
    }

    const titularId =
      item.catolider_titular_id && validUserIds.has(item.catolider_titular_id)
        ? item.catolider_titular_id
        : null;
    const aprendizId =
      item.catolider_aprendiz_id && validUserIds.has(item.catolider_aprendiz_id)
        ? item.catolider_aprendiz_id
        : null;

    const existe = await proyectoRepo.findOne({
      where: {
        nombre_proyecto: item.nombre_proyecto,
        semestre: item.semestre,
      },
    });

    if (!existe) {
      const nuevo = proyectoRepo.create({
        id_institucion: institucion.id,
        institucion,
        semestre: item.semestre,
        nombre_proyecto: item.nombre_proyecto,
        direccion_exacta: item.direccion_exacta,
        macrodistrito_zona: item.macrodistrito_zona,
        catolider_titular_id: titularId,
        catolider_aprendiz_id: aprendizId,
        supervisor_nombre: item.nombre_supervisor_centro,
        supervisor_telefono: item.telefono_contacto,
        correo: item.correo,
        fecha_inicio_convenio: item.fecha_inicio_convenio,
        fecha_fin_convenio: item.fecha_fin_convenio,
        poblacion_objetivo: item.poblacion_objetivo,
        actividades_semestre_actual: item.actividades_semestre_actual,
        monto_pasaje_por_dia: Number(item.monto_pasaje_fijo),
        cupo_maximo: item.cupo_maximo_voluntarios,
        activo: true,
      });
      await proyectoRepo.save(nuevo);
    } else {
      existe.id_institucion = institucion.id;
      existe.semestre = item.semestre;
      existe.catolider_titular_id = titularId;
      existe.catolider_aprendiz_id = aprendizId;
      existe.supervisor_nombre = item.nombre_supervisor_centro;
      existe.supervisor_telefono = item.telefono_contacto;
      existe.monto_pasaje_por_dia = Number(item.monto_pasaje_fijo);
      existe.cupo_maximo = item.cupo_maximo_voluntarios;
      existe.direccion_exacta = item.direccion_exacta;
      existe.macrodistrito_zona = item.macrodistrito_zona;
      existe.correo = item.correo;
      existe.fecha_inicio_convenio = item.fecha_inicio_convenio;
      existe.fecha_fin_convenio = item.fecha_fin_convenio;
      existe.poblacion_objetivo = item.poblacion_objetivo;
      existe.actividades_semestre_actual = item.actividades_semestre_actual;
      await proyectoRepo.save(existe);
    }
  }
}

async function execute() {
  try {
    await dataSource.initialize();
    await runProyectosSeed(dataSource);
    console.log('Seed de instituciones y proyectos ejecutado exitosamente.');
    await dataSource.destroy();
  } catch (error) {
    console.error('Error al ejecutar seed de proyectos:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  void execute();
}
