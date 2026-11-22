import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'catovoluntarios_db',
  entities: [
    join(__dirname, '/../**/*.entity{.ts,.js}'),
    'dist/**/*.entity.js',
    'src/**/*.entity.ts',
  ],
  migrations: [
    join(__dirname, '/migrations/*{.ts,.js}'),
    'dist/database/migrations/*.js',
    'src/database/migrations/*.ts',
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
};

export const getTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USER', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
  database: configService.get<string>('DATABASE_NAME', 'catovoluntarios_db'),
  entities: [
    join(__dirname, '/../**/*.entity{.ts,.js}'),
    'dist/**/*.entity.js',
    'src/**/*.entity.ts',
  ],
  migrations: [
    join(__dirname, '/migrations/*{.ts,.js}'),
    'dist/database/migrations/*.js',
    'src/database/migrations/*.ts',
  ],
  synchronize: false,
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl:
    configService.get<string>('DATABASE_SSL') === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
