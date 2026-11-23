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
import { EntrevistasModule } from './modules/entrevistas/entrevistas.module';
import { SimuladosM03Module } from './simulados-m03/simulados-m03.module';

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
    MailModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    EntrevistasModule, // M03 — Marvin Mollo
    SimuladosM03Module, // ⚠ TEMPORAL M03
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
