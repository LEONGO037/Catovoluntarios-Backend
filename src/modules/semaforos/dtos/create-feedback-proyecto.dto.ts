import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateFeedbackProyectoDto {
  @IsInt()
  proyectoId: number;

  @IsString()
  @IsNotEmpty({ message: 'El semestre evaluado es obligatorio' })
  semestre: string;

  @IsInt()
  @Min(0)
  voluntariosRecibidos: number;

  @IsInt()
  @Min(0)
  voluntariosCulminados: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  calificacionGrupo?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  calificacionCatolider?: number;

  @IsBoolean()
  solicitaContinuidadConvenio: boolean;

  @IsInt()
  @Min(1)
  cuposSolicitadosProximoSemestre: number;

  @IsString()
  @IsNotEmpty({
    message:
      'El Bloque 4 de observaciones, sugerencias y testimonio libre del centro es obligatorio',
  })
  bloque4ObservacionesSugerenciasLibres: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del responsable de llenado es obligatorio' })
  nombreResponsableLlenado: string;

  @IsOptional()
  @IsString()
  cargoResponsable?: string;

  @IsOptional()
  @IsString()
  documentoRespaldoUrl?: string;
}
