export interface ProyectoSeedData {
  institucion_nombre: string;
  semestre: string;
  nombre_proyecto: string;
  direccion_exacta: string;
  macrodistrito_zona: string;
  nombre_supervisor_centro: string;
  telefono_contacto: string;
  correo: string;
  fecha_inicio_convenio: string;
  fecha_fin_convenio: string;
  poblacion_objetivo: string;
  actividades_semestre_actual: string;
  monto_pasaje_fijo: number;
  cupo_maximo_voluntarios: number;
  catolider_titular_id: number | null;
  catolider_aprendiz_id: number | null;
}

export const PROYECTOS_RECEPTORES_SEED: ProyectoSeedData[] = [
  {
    institucion_nombre: 'Hogar de Niños San José',
    semestre: '2/2026',
    nombre_proyecto: 'Hogar de Niños San José',
    direccion_exacta: 'Av. Buenos Aires Nro. 1420, esq. Max Paredes',
    macrodistrito_zona: 'Cotahuma',
    nombre_supervisor_centro: 'Hna. Teresa Morales',
    telefono_contacto: '2491028',
    correo: 'hogar.sanjose@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo:
      'Niños y niñas en situación de acogida temporal (4 a 12 años)',
    actividades_semestre_actual:
      'Refuerzo escolar matutino, talleres de psicomotricidad y dinámicas lúdicas de integración',
    monto_pasaje_fijo: 10.0,
    cupo_maximo_voluntarios: 15,
    catolider_titular_id: 1,
    catolider_aprendiz_id: 2,
  },
  {
    institucion_nombre: 'Centro de Acogida San Ramón',
    semestre: '2/2026',
    nombre_proyecto: 'Centro de Acogida San Ramón',
    direccion_exacta: 'Calle 18 Nro. 300, Urb. Las Retamas',
    macrodistrito_zona: 'Sur - Achumani',
    nombre_supervisor_centro: 'Lic. Gonzalo Fernández',
    telefono_contacto: '2793041',
    correo: 'sanramon.achumani@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo: 'Adultos mayores en residencia permanente',
    actividades_semestre_actual:
      'Acompañamiento afectivo, talleres de estimulación cognitiva, lectura guiada y paseos asistidos',
    monto_pasaje_fijo: 15.0,
    cupo_maximo_voluntarios: 20,
    catolider_titular_id: 3,
    catolider_aprendiz_id: 4,
  },
  {
    institucion_nombre: 'Comedor Popular San Francisco de Asís',
    semestre: '2/2026',
    nombre_proyecto: 'Comedor Popular San Francisco de Asís',
    direccion_exacta: 'Plaza San Francisco, Calle Sagárnaga s/n',
    macrodistrito_zona: 'Centro',
    nombre_supervisor_centro: 'Fray Javier Alarcón',
    telefono_contacto: '2310492',
    correo: 'comedor.sanfrancisco@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo:
      'Personas en situación de vulnerabilidad extrema y personas adultas mayores',
    actividades_semestre_actual:
      'Apoyo en preparación y distribución de raciones alimentarias, registro de beneficiarios y contención fraterna',
    monto_pasaje_fijo: 10.0,
    cupo_maximo_voluntarios: 12,
    catolider_titular_id: 5,
    catolider_aprendiz_id: null,
  },
  {
    institucion_nombre: 'Centro Infantil Comunitario Virgen de Copacabana',
    semestre: '2/2026',
    nombre_proyecto: 'Centro Infantil Comunitario Virgen de Copacabana',
    direccion_exacta: 'Av. Naciones Unidas Nro. 850, parada 3',
    macrodistrito_zona: 'Max Paredes - Munaypata',
    nombre_supervisor_centro: 'Prof. Martha Quisbert',
    telefono_contacto: '2456781',
    correo: 'infantil.munaypata@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo:
      'Primera infancia (hijos e hijas de comerciantes gremiales)',
    actividades_semestre_actual:
      'Estimulación temprana, talleres de higiene dental, apoyo nutricional y juegos didácticos',
    monto_pasaje_fijo: 12.0,
    cupo_maximo_voluntarios: 18,
    catolider_titular_id: 6,
    catolider_aprendiz_id: 7,
  },
  {
    institucion_nombre: 'Fe y Alegría Alto Pampahasi',
    semestre: '2/2026',
    nombre_proyecto: 'Centro de Apoyo Escolar Fe y Alegría Alto Pampahasi',
    direccion_exacta: 'Sector Samapa, Calle 4 Nro. 52',
    macrodistrito_zona: 'San Antonio - Alto Pampahasi',
    nombre_supervisor_centro: 'Lic. René Cárdenas',
    telefono_contacto: '2234091',
    correo: 'feyalegria.pampahasi@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo:
      'Estudiantes de primaria y secundaria de la ladera este',
    actividades_semestre_actual:
      'Tutorías en matemáticas, física y lenguaje; biblioteca comunitaria y talleres vocacionales',
    monto_pasaje_fijo: 20.0,
    cupo_maximo_voluntarios: 16,
    catolider_titular_id: 8,
    catolider_aprendiz_id: 9,
  },
  {
    institucion_nombre: 'Hospital del Niño',
    semestre: '2/2026',
    nombre_proyecto: 'Hospital del Niño - Área Lúdica Pastoral',
    direccion_exacta: 'Calle Claudio Sanjinés s/n, Miraflores',
    macrodistrito_zona: 'Centro - Miraflores',
    nombre_supervisor_centro: 'Lic. Beatriz Condori',
    telefono_contacto: '2228394',
    correo: 'ludica.hospdelnino@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo: 'Pacientes pediátricos en internación prolongada',
    actividades_semestre_actual:
      'Pedagogía hospitalaria, lectura de cuentos en sala, musicoterapia y apoyo emocional a padres',
    monto_pasaje_fijo: 10.0,
    cupo_maximo_voluntarios: 10,
    catolider_titular_id: 10,
    catolider_aprendiz_id: null,
  },
  {
    institucion_nombre: 'Aldeas Infantiles SOS Mallasa',
    semestre: '2/2026',
    nombre_proyecto: 'Aldeas Infantiles SOS - Programa Familiar Mallasa',
    direccion_exacta: 'Av. Hernán Siles Zuazo Nro. 410',
    macrodistrito_zona: 'Mallasa',
    nombre_supervisor_centro: 'Lic. Claudia Beltrán',
    telefono_contacto: '2748192',
    correo: 'aldeas.mallasa@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo:
      'Familias y adolescentes en proceso de vida independiente',
    actividades_semestre_actual:
      'Orientación para el empleo, habilidades para la vida, acompañamiento en tareas y talleres artísticos',
    monto_pasaje_fijo: 20.0,
    cupo_maximo_voluntarios: 14,
    catolider_titular_id: 11,
    catolider_aprendiz_id: 12,
  },
  {
    institucion_nombre: 'Centro de Acogida Refugio de Esperanza',
    semestre: '2/2026',
    nombre_proyecto: 'Centro de Acogida Refugio de Esperanza',
    direccion_exacta: 'Av. Las Américas Nro. 670, Villa Fátima',
    macrodistrito_zona: 'Periférica - Villa Fátima',
    nombre_supervisor_centro: 'Hna. Rosario Apaza',
    telefono_contacto: '2214902',
    correo: 'refugio.esperanza@pastoral.ucb.edu.bo',
    fecha_inicio_convenio: '2026-02-01',
    fecha_fin_convenio: '2026-12-31',
    poblacion_objetivo: 'Madres adolescentes y niños en primera infancia',
    actividades_semestre_actual:
      'Cuidado infantil mientras las madres estudian, talleres de computación básica y costura comunitaria',
    monto_pasaje_fijo: 12.0,
    cupo_maximo_voluntarios: 15,
    catolider_titular_id: 13,
    catolider_aprendiz_id: null,
  },
];
