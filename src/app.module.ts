import { Module } from '@nestjs/common';
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
import { SemaforosModule } from './modules/semaforos/semaforos.module';
import { PostulacionesModule } from './modules/postulaciones/postulaciones.module';
import { ProyectosModule } from './modules/proyectos/proyectos.module';
import { UbicacionModule } from './modules/ubicacion/ubicacion.module';

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
    SemaforosModule,
    PostulacionesModule,
    ProyectosModule,
    UbicacionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
