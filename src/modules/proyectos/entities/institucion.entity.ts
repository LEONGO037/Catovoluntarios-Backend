import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProyectoReceptorEntity } from './proyecto-receptor.entity';

@Entity('instituciones')
export class InstitucionEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  get id_institucion(): number {
    return this.id;
  }
  set id_institucion(val: number) {
    this.id = val;
  }

  @Column({ type: 'varchar', length: 200, name: 'nombre' })
  nombre: string;

  get nombre_institucion(): string {
    return this.nombre;
  }
  set nombre_institucion(val: string) {
    this.nombre = val;
  }

  @Column({
    type: 'varchar',
    length: 255,
    name: 'direccion_exacta',
    default: '',
  })
  direccion_exacta: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'macrodistrito_zona',
    default: 'Centro',
  })
  macrodistrito_zona: string;

  @Column({
    type: 'varchar',
    length: 150,
    name: 'nombre_supervisor_centro',
    default: 'Supervisor Asignado',
  })
  nombre_supervisor_centro: string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'telefono_contacto',
    default: '70000000',
  })
  telefono_contacto: string;

  @Column({
    type: 'varchar',
    length: 150,
    name: 'correo',
    nullable: true,
    default: 'centro@pastoral.ucb.edu.bo',
  })
  correo: string | null;

  @Column({ type: 'date', name: 'fecha_inicio_convenio', nullable: true })
  fecha_inicio_convenio: string | null;

  @Column({ type: 'date', name: 'fecha_fin_convenio', nullable: true })
  fecha_fin_convenio: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => ProyectoReceptorEntity, (proyecto) => proyecto.institucion)
  proyectos: ProyectoReceptorEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
