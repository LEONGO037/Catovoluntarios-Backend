import { Inject } from '@nestjs/common';

export const InjectRepository = (entity: any) =>
  Inject(`${entity.name || entity}Repository`);

export const getRepositoryToken = (entity: any) =>
  `${entity.name || entity}Repository`;

export class TypeOrmModule {
  static forFeature() {
    return { module: class {} };
  }
  static forRootAsync() {
    return { module: class {} };
  }
}
