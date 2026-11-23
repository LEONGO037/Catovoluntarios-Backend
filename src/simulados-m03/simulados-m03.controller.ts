/**
 * ⚠ TEMPORAL (M03) — Catálogos mínimos para P-08 mientras no exista el
 * módulo de Proyectos Receptores (M05). Reemplazar por GET /api/proyectos.
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { LecturasExternasService, ProyectoReceptorOpcion } from './lecturas-externas.service';

@Controller('simulados-m03')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SimuladosM03Controller {
  constructor(private readonly lecturas: LecturasExternasService) {}

  @Get('proyectos-receptores')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  listarProyectosReceptores(): Promise<ProyectoReceptorOpcion[]> {
    return this.lecturas.listarProyectosReceptores();
  }
}
