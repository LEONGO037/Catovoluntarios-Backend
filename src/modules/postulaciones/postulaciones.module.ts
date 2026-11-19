import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostulacionEntity } from './entities/postulacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { PostulacionesService } from './postulaciones.service';
import { PostulacionesController } from './postulaciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PostulacionEntity, UserEntity])],
  controllers: [PostulacionesController],
  providers: [PostulacionesService],
  exports: [TypeOrmModule, PostulacionesService],
})
export class PostulacionesModule {}
