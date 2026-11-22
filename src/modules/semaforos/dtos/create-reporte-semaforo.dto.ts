import { IsInt, IsNotEmpty, IsString, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateReporteSemaforoDto {
  @IsInt()
  idAsignacion: number;

  @IsString()
  @IsNotEmpty({ message: 'El mes a reportar es obligatorio' })
  mes: string;

  @IsOptional()
  @IsInt()
  anio?: number;

  @IsString()
  @IsIn(['Verde', 'Amarillo', 'Rojo', 'Morado', 'VERDE', 'AMARILLO', 'ROJO', 'MORADO'], {
    message: 'El color del semáforo debe ser Verde, Amarillo, Rojo o Morado',
  })
  colorSemaforo: string;

  @IsString()
  @IsNotEmpty({
    message: 'La justificación u observaciones de desempeño son obligatorias según normativa Pastoral',
  })
  observacionesDesempeno: string;

  @IsOptional()
  @IsBoolean()
  notificarAbandono?: boolean;

  @IsOptional()
  @IsInt()
  catoliderEvaluadorId?: number;
}
