import { Inject } from '@nestjs/common';

export const getRepositoryToken = (entity: any) => {
  if (typeof entity === 'string') return `${entity}Repository`;
  return `${entity.name || entity}Repository`;
};

export const InjectRepository = (entity: any) =>
  Inject(getRepositoryToken(entity));

export class TypeOrmModule {
  static forFeature(entities: any[] = []) {
    return {
      module: class TypeOrmFeatureModule {},
      providers: entities.map((entity) => ({
        provide: getRepositoryToken(entity),
        useValue: {},
      })),
      exports: entities.map((entity) => getRepositoryToken(entity)),
    };
  }

  static forRootAsync(_options?: any) {
    return {
      module: class TypeOrmRootModule {},
    };
  }
}
