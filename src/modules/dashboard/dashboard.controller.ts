import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async getMetrics(@Query('semestre') semestre?: string) {
    return this.dashboardService.getExecutiveMetrics(semestre);
  }

  @Get('cupos-proyectos')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async getCupos(@Query('semestre') semestre?: string) {
    return this.dashboardService.getCuposProyectos(semestre);
  }

  @Get('semaforo-operativo')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async getSemaforo(@Query('mes') mes?: string) {
    return this.dashboardService.getSemaforoOperativo(mes);
  }

  @Get('notificaciones-urgentes')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async getNotificaciones() {
    return this.dashboardService.getNotificacionesUrgentes();
  }
}
