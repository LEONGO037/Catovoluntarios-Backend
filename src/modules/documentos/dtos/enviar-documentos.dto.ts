import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class EnviarDocumentosDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  documentoIds: number[];
}
