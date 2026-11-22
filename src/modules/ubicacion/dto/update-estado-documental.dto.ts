import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateEstadoDocumentalDto {
  @IsOptional()
  @IsBoolean()
  poliza_validada?: boolean;

  @IsOptional()
  @IsBoolean()
  induccion_completada?: boolean;
}
