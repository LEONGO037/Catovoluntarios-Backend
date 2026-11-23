import { DataSource } from 'typeorm';
import dataSource from '../data-source';

export async function seedEstudiantes(ds: DataSource) {
  const estudiantes = [
    { id: 101, nombres: 'Valeria Nicole', primer_apellido: 'Morales', segundo_apellido: 'Rios', ci: '8492019', carrera: 'Ingeniería de Sistemas', email: 'valeria.morales@ucb.edu.bo' },
    { id: 102, nombres: 'Carlos Eduardo', primer_apellido: 'Mendoza', segundo_apellido: 'Silva', ci: '7102948', carrera: 'Psicología', email: 'carlos.mendoza@ucb.edu.bo' },
    { id: 103, nombres: 'Mariana Sofia', primer_apellido: 'Alvarez', segundo_apellido: 'Torrez', ci: '9182304', carrera: 'Medicina', email: 'mariana.alvarez@ucb.edu.bo' },
    { id: 104, nombres: 'Rodrigo Javier', primer_apellido: 'Flores', segundo_apellido: 'Quispe', ci: '8392011', carrera: 'Derecho', email: 'rodrigo.flores@ucb.edu.bo' },
    { id: 105, nombres: 'Camila Andrea', primer_apellido: 'Gutierrez', segundo_apellido: 'Paz', ci: '6948201', carrera: 'Comunicación Social', email: 'camila.gutierrez@ucb.edu.bo' },
    { id: 106, nombres: 'Mateo Sebastian', primer_apellido: 'Vargas', segundo_apellido: 'Rojas', ci: '7920194', carrera: 'Administración de Empresas', email: 'mateo.vargas.r@ucb.edu.bo' },
    { id: 107, nombres: 'Luciana Belen', primer_apellido: 'Ramos', segundo_apellido: 'Castro', ci: '9021847', carrera: 'Arquitectura', email: 'luciana.ramos@ucb.edu.bo' },
    { id: 108, nombres: 'Alejandro Gabriel', primer_apellido: 'Mamani', segundo_apellido: 'Cruz', ci: '8102938', carrera: 'Ingeniería Industrial', email: 'alejandro.mamani@ucb.edu.bo' },
    { id: 109, nombres: 'Daniela Fernanda', primer_apellido: 'Perez', segundo_apellido: 'Ortiz', ci: '7482910', carrera: 'Psicología', email: 'daniela.perez@ucb.edu.bo' },
    { id: 110, nombres: 'Jorge Ignacio', primer_apellido: 'Chavez', segundo_apellido: 'Pinto', ci: '8910293', carrera: 'Ingeniería de Sistemas', email: 'jorge.chavez@ucb.edu.bo' },
    { id: 111, nombres: 'Natalia Eugenia', primer_apellido: 'Arce', segundo_apellido: 'Beltran', ci: '8291034', carrera: 'Medicina', email: 'natalia.arce@ucb.edu.bo' },
    { id: 112, nombres: 'Gabriel Andres', primer_apellido: 'Romero', segundo_apellido: 'Luna', ci: '9102837', carrera: 'Derecho', email: 'gabriel.romero@ucb.edu.bo' },
  ];

  for (const e of estudiantes) {
    await ds.query(
      `INSERT INTO usuarios (id, nombres, primer_apellido, segundo_apellido, ci, email, password_hash, rol, carrera, activo)
       VALUES ($1, $2, $3, $4, $5, $6, 'dummy_hash', 'VOLUNTARIO', $7, true)
       ON CONFLICT (id) DO UPDATE SET nombres = EXCLUDED.nombres, email = EXCLUDED.email`,
      [e.id, e.nombres, e.primer_apellido, e.segundo_apellido, e.ci, e.email, e.carrera],
    );
  }
}

async function run() {
  await dataSource.initialize();
  await seedEstudiantes(dataSource);
  console.log('Estudiantes demo vinculados a usuarios exitosamente.');
  await dataSource.destroy();
}

if (require.main === module) {
  run().catch(console.error);
}
