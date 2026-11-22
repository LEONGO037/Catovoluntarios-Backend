import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: number) {
    const user = await this.usersService.findById(userId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  @Get()
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('reset-catolideres')
  @Roles(Role.ADMIN_PASTORAL)
  async resetCatolideres(@Body('semestre') semestre?: string) {
    return this.usersService.resetCatolideres(semestre);
  }
}
