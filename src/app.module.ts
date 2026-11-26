import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MailModule } from './modules/mail/mail.module';
import { StorageModule } from './modules/storage/storage.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { SemaforosModule } from './modules/semaforos/semaforos.module';
import { PostulacionesModule } from './modules/postulaciones/postulaciones.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';
import { UbicacionModule } from './modules/ubicacion/ubicacion.module';
import { EntrevistasModule } from './modules/entrevistas/entrevistas.module';
import { AsistenciaModule } from './modules/asistencia/asistencia.module';
import { SimuladosM03Module } from './simulados-m03/simulados-m03.module';
import { AuthenticationGuard } from './common/guards/authentication.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Configuración de base de datos no encontrada');
        }
        return dbConfig;
      },
    }),
    StorageModule,
    MailModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    DocumentosModule,
    NotificacionesModule,
    SemaforosModule,
    PostulacionesModule,
    ProyectosModule,
    UbicacionModule,
    EntrevistasModule,
    AsistenciaModule,
    SimuladosM03Module,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthenticationGuard }],
})
export class AppModule {}
