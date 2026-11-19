import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  Matches,
} from 'class-validator';
import { TipoRelacionUcb } from '../entities/postulacion.entity';

export class CreatePostulacionDto {
  @IsEnum(TipoRelacionUcb, { message: 'Debe seleccionar un tipo de relación institucional válido' })
  tipoRelacionUcb: TipoRelacionUcb;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'El primer apellido es obligatorio' })
  primerApellido: string;

  @IsString()
  @IsOptional()
  segundoApellido?: string;

  @IsString()
  @IsNotEmpty({ message: 'El documento de identidad es obligatorio' })
  ci: string;

  @IsString()
  @IsOptional()
  complemento?: string;

  @IsString()
  @IsNotEmpty({ message: 'Debe seleccionar el departamento de expedición' })
  expedido: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de nacimiento debe tener formato AAAA-MM-DD' })
  fechaNacimiento: string;

  @IsInt()
  @Min(14, { message: 'La edad mínima para postular es de 14 años' })
  @Max(99)
  edad: number;

  @IsString()
  @Matches(/^[67]\d{7}$/, { message: 'El celular debe tener 8 dígitos y comenzar con 6 o 7' })
  celular: string;

  // Validación estricta RFC 5322 con dominio real (.com, .bo, .edu.bo, etc.)
  @IsString()
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'El correo electrónico debe ser una dirección válida con dominio completo (ej. usuario@dominio.com)',
  })
  correoElectronico: string;

  // Carrera: Puede ser string o 'N/A' si es familiar/externo
  @IsString()
  @IsOptional()
  carrera?: string;

  @IsString()
  @IsNotEmpty({ message: 'Debe especificar su zona de residencia' })
  zonaResidencia: string;

  // Control de Carga Académica
  @IsInt({ message: 'El número de materias debe ser un número entero' })
  @Min(0, { message: 'El número de materias no puede ser negativo' })
  @Max(10, { message: 'El número de materias no puede exceder 10' })
  numeroMaterias: number;

  @IsBoolean()
  tieneMateriasPesadas: boolean;

  @IsString()
  @IsOptional()
  detalleMateriasPesadas?: string;

  @IsInt()
  @Min(0)
  @Max(10)
  actividadesExtracurriculares: number;

  @IsString()
  @IsOptional()
  detalleActividades?: string;

  // Perfil y Vocación
  @IsBoolean()
  experienciaVoluntariadoPrevia: boolean;

  @IsString()
  @IsOptional()
  detalleExperiencia?: string;

  @IsArray()
  @IsString({ each: true })
  habilidadesDestacadas: string[];

  @IsBoolean()
  conocimientoComputacion: boolean;

  @IsArray()
  @IsString({ each: true })
  tresPalabrasPersonalidad: string[];

  @IsString()
  @IsOptional()
  alergiasCondicionesMedicas?: string;

  @IsArray()
  @IsString({ each: true })
  poblacionesInteres: string[];

  // Consentimiento
  @IsBoolean()
  @IsOptional()
  requiereAutorizacionPadres?: boolean;

  @IsBoolean()
  @IsOptional()
  autorizacionPadresConfirmada?: boolean;

  @IsBoolean()
  compromisoAceptado: boolean;
}
