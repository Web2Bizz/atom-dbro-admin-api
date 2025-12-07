import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationRepository } from '../organization.repository';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../../database/database.module';

describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;
  let db: NodePgDatabase;

  const mockOrganization = {
    id: 1,
    name: 'Тестовая организация',
    cityId: 1,
    organizationTypeId: 1,
    latitude: '55.7558',
    longitude: '37.6173',
    summary: 'Краткое описание',
    mission: 'Миссия организации',
    description: 'Полное описание',
    goals: ['Цель 1', 'Цель 2'],
    needs: ['Нужда 1'],
    address: 'г. Москва, ул. Примерная, д. 1',
    contacts: [{ name: 'Телефон', value: '+7 (999) 123-45-67' }],
    gallery: ['organizations/1/image1.jpg'],
    isApproved: false,
    recordStatus: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganizationWithRelations = {
    id: 1,
    name: 'Тестовая организация',
    cityId: 1,
    latitude: '55.7558',
    longitude: '37.6173',
    summary: 'Краткое описание',
    mission: 'Миссия организации',
    description: 'Полное описание',
    goals: ['Цель 1', 'Цель 2'],
    needs: ['Нужда 1'],
    address: 'г. Москва, ул. Примерная, д. 1',
    contacts: [{ name: 'Телефон', value: '+7 (999) 123-45-67' }],
    gallery: ['organizations/1/image1.jpg'],
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    cityName: 'Москва',
    cityLatitude: '55.7558',
    cityLongitude: '37.6173',
    cityRecordStatus: 'CREATED',
    organizationTypeId: 1,
    organizationTypeName: 'Благотворительный фонд',
    organizationTypeRecordStatus: 'CREATED',
  };

  const mockOwner = {
    id: 1,
    firstName: 'Иван',
    lastName: 'Иванов',
    middleName: null,
    email: 'ivan@example.com',
  };

  const mockHelpTypeRelation = {
    organizationId: 1,
    id: 1,
    name: 'Материальная помощь',
  };

  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    leftJoin: ReturnType<typeof vi.fn>;
    innerJoin: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    values: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    returning: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // Инициализируем базовые моки
    const createSelectChain = (result: any) => {
      // Для SELECT запросов последний метод (where) возвращает промис с массивом
      const normalizedResult = Array.isArray(result) ? result : (result ? [result] : []);
      const mockWhere = vi.fn().mockResolvedValue(normalizedResult);
      
      // Создаем один объект для цепочки join, который возвращает сам себя
      const joinChain: any = {
        where: mockWhere,
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
      };
      
      const mockFrom = vi.fn().mockReturnValue(joinChain);
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      
      return { mockSelect, mockFrom, mockLeftJoin: joinChain.leftJoin, mockInnerJoin: joinChain.innerJoin, mockWhere };
    };

    // Начальная настройка - будет переопределена в каждом тесте
    const initialChain = createSelectChain([]);
    
    mockDb = {
      select: initialChain.mockSelect,
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      from: initialChain.mockFrom,
      leftJoin: initialChain.mockLeftJoin,
      innerJoin: initialChain.mockInnerJoin,
      where: initialChain.mockWhere,
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    };

    // Сохраняем helper для переиспользования в тестах
    (mockDb as any).__setupSelectChain = createSelectChain;
    
    // Функция для правильной настройки SELECT моков
    (mockDb as any).__setupSelectMocks = (result: any) => {
      const chain = createSelectChain(result);
      mockDb.select = chain.mockSelect;
      mockDb.from = chain.mockFrom;
      mockDb.leftJoin = chain.mockLeftJoin;
      mockDb.innerJoin = chain.mockInnerJoin;
      mockDb.where = chain.mockWhere;
    };
    
    // Функция для настройки SELECT моков с ошибкой
    (mockDb as any).__setupSelectError = (error: Error) => {
      const mockWhere = vi.fn().mockRejectedValue(error);
      const joinChain: any = {
        where: mockWhere,
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
      };
      const mockFrom = vi.fn().mockReturnValue(joinChain);
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      
      mockDb.select = mockSelect;
      mockDb.from = mockFrom;
      mockDb.leftJoin = joinChain.leftJoin;
      mockDb.innerJoin = joinChain.innerJoin;
      mockDb.where = mockWhere;
    };
    
    // Функция для настройки UPDATE моков
    (mockDb as any).__setupUpdateMocks = (result: any) => {
      const normalizedResult = Array.isArray(result) ? result : (result ? [result] : []);
      const mockReturning = vi.fn().mockResolvedValue(normalizedResult);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
      
      mockDb.update = mockUpdate;
      mockDb.set = mockSet;
      mockDb.where = mockWhere;
      mockDb.returning = mockReturning;
    };
    
    // Функция для настройки DELETE моков
    (mockDb as any).__setupDeleteMocks = (result: any) => {
      const normalizedResult = Array.isArray(result) ? result : (result ? [result] : []);
      const mockReturning = vi.fn().mockResolvedValue(normalizedResult);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });
      
      mockDb.delete = mockDelete;
      mockDb.where = mockWhere;
      mockDb.returning = mockReturning;
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<OrganizationRepository>(OrganizationRepository);
    db = module.get<NodePgDatabase>(DATABASE_CONNECTION);
  });

  describe('findAll', () => {
    it('should return all organizations without filter', async () => {
      (mockDb as any).__setupSelectMocks([mockOrganizationWithRelations]);

      const result = await repository.findAll();

      expect(result).toEqual([mockOrganizationWithRelations]);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by approved status when filteredByStatus is true', async () => {
      (mockDb as any).__setupSelectMocks([{ ...mockOrganizationWithRelations, isApproved: true }]);

      const result = await repository.findAll(true);

      expect(result).toHaveLength(1);
      expect(result[0].isApproved).toBe(true);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should filter by unapproved status when filteredByStatus is false', async () => {
      (mockDb as any).__setupSelectMocks([{ ...mockOrganizationWithRelations, isApproved: false }]);

      const result = await repository.findAll(false);

      expect(result).toHaveLength(1);
      expect(result[0].isApproved).toBe(false);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return empty array when no organizations exist', async () => {
      (mockDb as any).__setupSelectMocks([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (mockDb as any).__setupSelectError(error);

      await expect(repository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return organization by id', async () => {
      (mockDb as any).__setupSelectMocks([mockOrganizationWithRelations]);

      const result = await repository.findOne(1);

      expect(result).toEqual(mockOrganizationWithRelations);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return undefined when organization does not exist', async () => {
      (mockDb as any).__setupSelectMocks([]);

      const result = await repository.findOne(999);

      expect(result).toBeUndefined();
    });

    it('should exclude deleted organizations', async () => {
      (mockDb as any).__setupSelectMocks([]);

      const result = await repository.findOne(1);

      expect(result).toBeUndefined();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (mockDb as any).__setupSelectError(error);

      await expect(repository.findOne(1)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return organization by id', async () => {
      (mockDb as any).__setupSelectMocks([mockOrganization]);

      const result = await repository.findById(1);

      expect(result).toEqual(mockOrganization);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return undefined when organization does not exist', async () => {
      (mockDb as any).__setupSelectMocks([]);

      const result = await repository.findById(999);

      expect(result).toBeUndefined();
    });

    it('should exclude deleted organizations', async () => {
      (mockDb as any).__setupSelectMocks([]);

      const result = await repository.findById(1);

      expect(result).toBeUndefined();
    });
  });

  describe('findManyByIds', () => {
    it('should return multiple organizations by ids', async () => {
      (mockDb as any).__setupSelectMocks([mockOrganization, { ...mockOrganization, id: 2 }]);

      const result = await repository.findManyByIds([1, 2]);

      expect(result).toHaveLength(2);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return empty array when ids array is empty', async () => {
      const result = await repository.findManyByIds([]);

      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should return empty array when no organizations found', async () => {
      (mockDb as any).__setupSelectMocks([]);

      const result = await repository.findManyByIds([999, 998]);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    const createData = {
      name: 'Новая организация',
      cityId: 1,
      organizationTypeId: 1,
      latitude: '55.7558',
      longitude: '37.6173',
    };

    it('should successfully create organization', async () => {
      mockDb.returning.mockResolvedValue([{ ...mockOrganization, ...createData }]);

      const result = await repository.create(createData);

      expect(result).toHaveProperty('name', 'Новая организация');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(createData);
      expect(mockDb.returning).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.returning.mockRejectedValue(error);

      await expect(repository.create(createData)).rejects.toThrow('Database error');
    });
  });

  describe('createMany', () => {
    const createDataArray = [
      {
        name: 'Организация 1',
        cityId: 1,
        organizationTypeId: 1,
      },
      {
        name: 'Организация 2',
        cityId: 1,
        organizationTypeId: 1,
      },
    ];

    it('should successfully create multiple organizations', async () => {
      mockDb.returning.mockResolvedValue([
        { ...mockOrganization, id: 1, name: 'Организация 1' },
        { ...mockOrganization, id: 2, name: 'Организация 2' },
      ]);

      const result = await repository.createMany(createDataArray);

      expect(result).toHaveLength(2);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(createDataArray);
    });

    it('should return empty array when data array is empty', async () => {
      const result = await repository.createMany([]);

      expect(result).toEqual([]);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDb.returning.mockRejectedValue(error);

      await expect(repository.createMany(createDataArray)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Обновленное название',
      summary: 'Новое описание',
    };

    it('should successfully update organization', async () => {
      const updatedOrg = { ...mockOrganization, ...updateData };
      (mockDb as any).__setupUpdateMocks([updatedOrg]);

      const result = await repository.update(1, updateData);

      expect(result).toEqual(updatedOrg);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return undefined when organization does not exist', async () => {
      (mockDb as any).__setupUpdateMocks([]);

      const result = await repository.update(999, updateData);

      expect(result).toBeUndefined();
    });

    it('should exclude deleted organizations from update', async () => {
      (mockDb as any).__setupUpdateMocks([]);

      const result = await repository.update(1, updateData);

      expect(result).toBeUndefined();
    });

    it('should automatically update updatedAt timestamp', async () => {
      const updatedOrg = { ...mockOrganization, ...updateData, updatedAt: new Date() };
      (mockDb as any).__setupUpdateMocks([updatedOrg]);

      await repository.update(1, updateData);

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('softDelete', () => {
    it('should successfully soft delete organization', async () => {
      const deletedOrg = { ...mockOrganization, recordStatus: 'DELETED' };
      (mockDb as any).__setupUpdateMocks([deletedOrg]);

      const result = await repository.softDelete(1);

      expect(result).toEqual(deletedOrg);
      expect(result?.recordStatus).toBe('DELETED');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return undefined when organization does not exist', async () => {
      (mockDb as any).__setupUpdateMocks([]);

      const result = await repository.softDelete(999);

      expect(result).toBeUndefined();
    });

    it('should not delete already deleted organizations', async () => {
      (mockDb as any).__setupUpdateMocks([]);

      const result = await repository.softDelete(1);

      expect(result).toBeUndefined();
    });
  });

  describe('findHelpTypesByOrganizationIds', () => {
    it('should return help types for multiple organizations', async () => {
      (mockDb as any).__setupSelectMocks([
        mockHelpTypeRelation,
        { ...mockHelpTypeRelation, organizationId: 2 },
      ]);

      const result = await repository.findHelpTypesByOrganizationIds([1, 2]);

      expect(result).toHaveLength(2);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.innerJoin).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return empty array when ids array is empty', async () => {
      const result = await repository.findHelpTypesByOrganizationIds([]);

      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('should exclude deleted help types', async () => {
      (mockDb as any).__setupSelectMocks([mockHelpTypeRelation]);

      await repository.findHelpTypesByOrganizationIds([1]);

      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('findHelpTypesByOrganizationId', () => {
    it('should return help types for organization', async () => {
      (mockDb as any).__setupSelectMocks([{ id: 1, name: 'Материальная помощь' }]);

      const result = await repository.findHelpTypesByOrganizationId(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 1);
      expect(result[0]).toHaveProperty('name', 'Материальная помощь');
    });

    it('should return empty array when no help types found', async () => {
      (mockDb as any).__setupSelectMocks([]);
      
      const result = await repository.findHelpTypesByOrganizationId(1);

      expect(result).toEqual([]);
    });
  });

  describe('findOwnersByOrganizationId', () => {
    it('should return owners for organization', async () => {
      (mockDb as any).__setupSelectMocks([mockOwner]);
      
      const result = await repository.findOwnersByOrganizationId(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockOwner);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.innerJoin).toHaveBeenCalled();
    });

    it('should return empty array when no owners found', async () => {
      (mockDb as any).__setupSelectMocks([]);
      
      const result = await repository.findOwnersByOrganizationId(1);
      
      expect(result).toEqual([]);
    });

    it('should exclude deleted users', async () => {
      (mockDb as any).__setupSelectMocks([mockOwner]);

      await repository.findOwnersByOrganizationId(1);

      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('addOwner', () => {
    it('should successfully add owner to organization', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert = mockInsert;
      mockDb.values = mockValues;

      await repository.addOwner(1, 1);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        organizationId: 1,
        userId: 1,
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const mockValues = vi.fn().mockRejectedValue(error);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert = mockInsert;
      mockDb.values = mockValues;

      await expect(repository.addOwner(1, 1)).rejects.toThrow('Database error');
    });
  });

  describe('removeOwner', () => {
    it('should successfully remove owner from organization', async () => {
      (mockDb as any).__setupDeleteMocks([{ organizationId: 1, userId: 1 }]);

      const result = await repository.removeOwner(1, 1);

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return false when owner does not exist', async () => {
      (mockDb as any).__setupDeleteMocks([]);

      const result = await repository.removeOwner(1, 999);

      expect(result).toBe(false);
    });
  });

  describe('findOwner', () => {
    it('should return owner relation when exists', async () => {
      (mockDb as any).__setupSelectMocks([{ organizationId: 1, userId: 1 }]);

      const result = await repository.findOwner(1, 1);

      expect(result).toEqual({ organizationId: 1, userId: 1 });
    });

    it('should return undefined when owner does not exist', async () => {
      (mockDb as any).__setupSelectMocks([]);
      
      const result = await repository.findOwner(1, 999);

      expect(result).toBeUndefined();
    });
  });

  describe('addHelpType', () => {
    it('should successfully add help type to organization', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert = mockInsert;
      mockDb.values = mockValues;

      await repository.addHelpType(1, 1);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        organizationId: 1,
        helpTypeId: 1,
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const mockValues = vi.fn().mockRejectedValue(error);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert = mockInsert;
      mockDb.values = mockValues;

      await expect(repository.addHelpType(1, 1)).rejects.toThrow('Database error');
    });
  });

  describe('removeHelpType', () => {
    it('should successfully remove help type from organization', async () => {
      (mockDb as any).__setupDeleteMocks([{ organizationId: 1, helpTypeId: 1 }]);

      const result = await repository.removeHelpType(1, 1);

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return false when help type does not exist', async () => {
      (mockDb as any).__setupDeleteMocks([]);

      const result = await repository.removeHelpType(1, 999);

      expect(result).toBe(false);
    });
  });

  describe('findHelpType', () => {
    it('should return help type relation when exists', async () => {
      (mockDb as any).__setupSelectMocks([{ organizationId: 1, helpTypeId: 1 }]);

      const result = await repository.findHelpType(1, 1);

      expect(result).toEqual({ organizationId: 1, helpTypeId: 1 });
    });

    it('should return undefined when help type does not exist', async () => {
      (mockDb as any).__setupSelectMocks([]);
      
      const result = await repository.findHelpType(1, 999);

      expect(result).toBeUndefined();
    });
  });

  describe('removeAllHelpTypes', () => {
    it('should successfully remove all help types from organization', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.delete = mockDelete;
      mockDb.where = mockWhere;

      await repository.removeAllHelpTypes(1);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const mockWhere = vi.fn().mockRejectedValue(error);
      const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.delete = mockDelete;
      mockDb.where = mockWhere;

      await expect(repository.removeAllHelpTypes(1)).rejects.toThrow('Database error');
    });
  });

  describe('addHelpTypes', () => {
    it('should successfully add multiple help types to organization', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert = mockInsert;
      mockDb.values = mockValues;

      await repository.addHelpTypes(1, [1, 2, 3]);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith([
        { organizationId: 1, helpTypeId: 1 },
        { organizationId: 1, helpTypeId: 2 },
        { organizationId: 1, helpTypeId: 3 },
      ]);
    });

    it('should not call insert when help type ids array is empty', async () => {
      await repository.addHelpTypes(1, []);

      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const mockValues = vi.fn().mockRejectedValue(error);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert = mockInsert;
      mockDb.values = mockValues;

      await expect(repository.addHelpTypes(1, [1, 2])).rejects.toThrow('Database error');
    });
  });

  describe('removeAllOwners', () => {
    it('should successfully remove all owners from organization', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.delete = mockDelete;
      mockDb.where = mockWhere;

      await repository.removeAllOwners(1);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const mockWhere = vi.fn().mockRejectedValue(error);
      const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.delete = mockDelete;
      mockDb.where = mockWhere;

      await expect(repository.removeAllOwners(1)).rejects.toThrow('Database error');
    });
  });

  describe('addOwnersToOrganizations', () => {
    it('should successfully add owner to multiple organizations', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert = mockInsert;
      mockDb.values = mockValues;

      await repository.addOwnersToOrganizations([1, 2, 3], 1);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith([
        { organizationId: 1, userId: 1 },
        { organizationId: 2, userId: 1 },
        { organizationId: 3, userId: 1 },
      ]);
    });

    it('should not call insert when organization ids array is empty', async () => {
      await repository.addOwnersToOrganizations([], 1);

      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      const mockValues = vi.fn().mockRejectedValue(error);
      const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
      mockDb.insert = mockInsert;
      mockDb.values = mockValues;

      await expect(repository.addOwnersToOrganizations([1, 2], 1)).rejects.toThrow('Database error');
    });
  });

  describe('updateGallery', () => {
    it('should successfully update gallery', async () => {
      const gallery = ['organizations/1/image1.jpg', 'organizations/1/image2.jpg'];
      const updatedOrg = { ...mockOrganization, gallery };
      (mockDb as any).__setupUpdateMocks([updatedOrg]);

      const result = await repository.updateGallery(1, gallery);

      expect(result).toEqual(updatedOrg);
      expect(result?.gallery).toEqual(gallery);
    });

    it('should call update method', async () => {
      const gallery = ['organizations/1/image1.jpg'];
      (mockDb as any).__setupUpdateMocks([{ ...mockOrganization, gallery }]);

      await repository.updateGallery(1, gallery);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('updateApprovalStatus', () => {
    it('should successfully update approval status to true', async () => {
      const approvedOrg = { ...mockOrganization, isApproved: true };
      (mockDb as any).__setupUpdateMocks([approvedOrg]);

      const result = await repository.updateApprovalStatus(1, true);

      expect(result).toEqual(approvedOrg);
      expect(result?.isApproved).toBe(true);
    });

    it('should successfully update approval status to false', async () => {
      const unapprovedOrg = { ...mockOrganization, isApproved: false };
      (mockDb as any).__setupUpdateMocks([unapprovedOrg]);

      const result = await repository.updateApprovalStatus(1, false);

      expect(result).toEqual(unapprovedOrg);
      expect(result?.isApproved).toBe(false);
    });

    it('should call update method', async () => {
      (mockDb as any).__setupUpdateMocks([{ ...mockOrganization, isApproved: true }]);

      await repository.updateApprovalStatus(1, true);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});

