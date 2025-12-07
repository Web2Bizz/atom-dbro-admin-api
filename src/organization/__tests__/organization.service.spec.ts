import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationService } from '../organization.service';
import { OrganizationRepository } from '../organization.repository';
import { S3Service } from '../s3.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { CreateOrganizationsBulkDto } from '../dto/create-organizations-bulk.dto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { ConfigService } from '@nestjs/config';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: OrganizationRepository;
  let s3Service: S3Service;
  let db: NodePgDatabase;

  const mockCity = {
    id: 1,
    name: 'Москва',
    latitude: '55.7558',
    longitude: '37.6173',
    regionId: 1,
    recordStatus: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrganizationType = {
    id: 1,
    name: 'Благотворительный фонд',
    recordStatus: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHelpType = {
    id: 1,
    name: 'Материальная помощь',
    recordStatus: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 1,
    firstName: 'Иван',
    lastName: 'Иванов',
    email: 'ivan@example.com',
    recordStatus: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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
    id: 1,
    name: 'Материальная помощь',
  };

  let mockRepository: {
    create: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findManyByIds: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    addOwner: ReturnType<typeof vi.fn>;
    removeOwner: ReturnType<typeof vi.fn>;
    findOwner: ReturnType<typeof vi.fn>;
    findOwnersByOrganizationId: ReturnType<typeof vi.fn>;
    addHelpType: ReturnType<typeof vi.fn>;
    removeHelpType: ReturnType<typeof vi.fn>;
    findHelpType: ReturnType<typeof vi.fn>;
    findHelpTypesByOrganizationId: ReturnType<typeof vi.fn>;
    findHelpTypesByOrganizationIds: ReturnType<typeof vi.fn>;
    addHelpTypes: ReturnType<typeof vi.fn>;
    removeAllHelpTypes: ReturnType<typeof vi.fn>;
    removeAllOwners: ReturnType<typeof vi.fn>;
    addOwnersToOrganizations: ReturnType<typeof vi.fn>;
    updateGallery: ReturnType<typeof vi.fn>;
    updateApprovalStatus: ReturnType<typeof vi.fn>;
  };

  let mockS3Service: {
    getImageUrls: ReturnType<typeof vi.fn>;
    uploadMultipleImages: ReturnType<typeof vi.fn>;
    deleteFiles: ReturnType<typeof vi.fn>;
    getFile: ReturnType<typeof vi.fn>;
  };

  let mockDb: {
    select: ReturnType<typeof vi.fn>;
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
  };

  // Helper функция для настройки моков db с цепочкой вызовов
  // results - массив результатов для последовательных вызовов db.select().from().where()
  // Каждый элемент results - это массив результатов для одного запроса
  const setupDbMock = (results: any[][]) => {
    let callIndex = 0;
    
    // Настраиваем mockSelect так, чтобы каждый вызов создавал новую цепочку с следующим результатом
    mockDb.select = vi.fn().mockImplementation(() => {
      const currentIndex = callIndex;
      const result = currentIndex < results.length ? results[currentIndex] : [];
      callIndex++;
      
      const mockWhere = vi.fn().mockResolvedValue(result);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      
      return { from: mockFrom };
    });
  };

  beforeEach(async () => {
    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks();
    
    // Создаем новые моки перед каждым тестом
    mockRepository = {
      create: vi.fn(),
      createMany: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      findManyByIds: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      addOwner: vi.fn(),
      removeOwner: vi.fn(),
      findOwner: vi.fn(),
      findOwnersByOrganizationId: vi.fn(),
      addHelpType: vi.fn(),
      removeHelpType: vi.fn(),
      findHelpType: vi.fn(),
      findHelpTypesByOrganizationId: vi.fn(),
      findHelpTypesByOrganizationIds: vi.fn(),
      addHelpTypes: vi.fn(),
      removeAllHelpTypes: vi.fn(),
      removeAllOwners: vi.fn(),
      addOwnersToOrganizations: vi.fn(),
      updateGallery: vi.fn(),
      updateApprovalStatus: vi.fn(),
    };

    mockS3Service = {
      getImageUrls: vi.fn((urls) => urls || []),
      uploadMultipleImages: vi.fn(),
      deleteFiles: vi.fn(),
      getFile: vi.fn(),
    };

    // Настройка мока для db с цепочкой вызовов
    mockDb = {
      select: vi.fn(),
      from: vi.fn(),
      where: vi.fn(),
    };

    // Мок для ConfigService (требуется для S3Service)
    const mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'S3_BUCKET_NAME') return 'test-bucket';
        if (key === 'S3_ACCESS_KEY_ID' || key === 'AWS_ACCESS_KEY_ID') return 'test-key';
        if (key === 'S3_SECRET_ACCESS_KEY' || key === 'AWS_SECRET_ACCESS_KEY') return 'test-secret';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OrganizationRepository,
          useValue: mockRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        OrganizationService,
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    repository = module.get<OrganizationRepository>(OrganizationRepository);
    s3Service = module.get<S3Service>(S3Service);
    db = module.get<NodePgDatabase>(DATABASE_CONNECTION);
    
    // Убеждаемся, что сервис создан и получил зависимости
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(repository).toBe(mockRepository);
    
    // Проверяем, что сервис получил repository
    // Если repository не внедрен, создаем сервис вручную
    if (!(service as any).repository) {
      service = new OrganizationService(mockRepository, mockS3Service, mockDb);
    }
  });

  describe('create', () => {
    const createDto: CreateOrganizationDto = {
      name: 'Тестовая организация',
      cityId: 1,
      typeId: 1,
      helpTypeIds: [1],
      latitude: 55.7558,
      longitude: 37.6173,
      summary: 'Краткое описание',
      mission: 'Миссия организации',
      description: 'Полное описание',
      goals: ['Цель 1', 'Цель 2'],
      needs: ['Нужда 1'],
      address: 'г. Москва, ул. Примерная, д. 1',
      contacts: [{ name: 'Телефон', value: '+7 (999) 123-45-67' }],
      gallery: ['https://example.com/image.jpg'],
    };

    it('should successfully create organization', async () => {
      // Настройка моков для последовательных вызовов db.select().from().where()
      // Порядок: city, organizationType, helpTypes (массив), user
      // Каждый результат должен быть массивом, так как используется деструктуризация [city]
      setupDbMock([[mockCity], [mockOrganizationType], [mockHelpType], [mockUser]]);
      
      mockRepository.create.mockResolvedValue(mockOrganization);
      mockRepository.addOwner.mockResolvedValue(undefined);
      mockRepository.addHelpTypes.mockResolvedValue(undefined);

      const result = await service.create(createDto, 1);

      expect(result).toEqual(mockOrganization);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.addOwner).toHaveBeenCalledWith(1, 1);
      expect(mockRepository.addHelpTypes).toHaveBeenCalledWith(1, [1]);
    });

    it('should throw NotFoundException when city does not exist', async () => {
      setupDbMock([[]]);

      await expect(service.create(createDto, 1)).rejects.toThrow(new NotFoundException('Город с ID 1 не найден'));
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization type does not exist', async () => {
      setupDbMock([[mockCity], []]);

      await expect(service.create(createDto, 1)).rejects.toThrow(new NotFoundException('Тип организации с ID 1 не найден'));
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when help type does not exist', async () => {
      setupDbMock([[mockCity], [mockOrganizationType], []]);

      await expect(service.create(createDto, 1)).rejects.toThrow(new NotFoundException('Виды помощи с ID 1 не найдены'));
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      setupDbMock([[mockCity], [mockOrganizationType], [mockHelpType], []]);

      await expect(service.create(createDto, 1)).rejects.toThrow(new NotFoundException('Пользователь с ID 1 не найден'));
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should use city coordinates when latitude/longitude not provided', async () => {
      const dtoWithoutCoords: CreateOrganizationDto = {
        ...createDto,
        latitude: undefined,
        longitude: undefined,
      };

      setupDbMock([[mockCity], [mockOrganizationType], [mockHelpType], [mockUser]]);
      
      mockRepository.create.mockResolvedValue(mockOrganization);
      mockRepository.addOwner.mockResolvedValue(undefined);
      mockRepository.addHelpTypes.mockResolvedValue(undefined);

      await service.create(dtoWithoutCoords, 1);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: mockCity.latitude,
          longitude: mockCity.longitude,
        })
      );
    });

    it('should handle duplicate help type IDs', async () => {
      const dtoWithDuplicates: CreateOrganizationDto = {
        ...createDto,
        helpTypeIds: [1, 1, 2],
      };

      setupDbMock([[mockCity], [mockOrganizationType], [mockHelpType, { ...mockHelpType, id: 2 }], [mockUser]]);
      
      mockRepository.create.mockResolvedValue(mockOrganization);
      mockRepository.addOwner.mockResolvedValue(undefined);
      mockRepository.addHelpTypes.mockResolvedValue(undefined);

      await service.create(dtoWithDuplicates, 1);

      expect(mockRepository.addHelpTypes).toHaveBeenCalledWith(1, [1, 2]);
    });
  });

  describe('findAll', () => {
    it('should return all organizations with help types', async () => {
      const orgs = [mockOrganizationWithRelations];
      const helpTypes = [
        { organizationId: 1, id: 1, name: 'Материальная помощь' },
      ];

      mockRepository.findAll.mockResolvedValue(orgs);
      mockRepository.findHelpTypesByOrganizationIds.mockResolvedValue(helpTypes);
      mockS3Service.getImageUrls.mockReturnValue(['http://example.com/image1.jpg']);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('helpTypes');
      expect(result[0].helpTypes).toEqual([{ id: 1, name: 'Материальная помощь' }]);
      expect(result[0].gallery).toEqual(['http://example.com/image1.jpg']);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should filter by approved status when filteredByStatus is true', async () => {
      const orgs = [{ ...mockOrganizationWithRelations, isApproved: true }];
      mockRepository.findAll.mockResolvedValue(orgs);
      mockRepository.findHelpTypesByOrganizationIds.mockResolvedValue([]);
      mockS3Service.getImageUrls.mockReturnValue([]);

      await service.findAll(true);

      expect(mockRepository.findAll).toHaveBeenCalledWith(true);
    });

    it('should filter by unapproved status when filteredByStatus is false', async () => {
      const orgs = [{ ...mockOrganizationWithRelations, isApproved: false }];
      mockRepository.findAll.mockResolvedValue(orgs);
      mockRepository.findHelpTypesByOrganizationIds.mockResolvedValue([]);
      mockS3Service.getImageUrls.mockReturnValue([]);

      await service.findAll(false);

      expect(mockRepository.findAll).toHaveBeenCalledWith(false);
    });

    it('should return empty array when no organizations exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);
      mockRepository.findHelpTypesByOrganizationIds.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should parse coordinates correctly', async () => {
      const orgs = [mockOrganizationWithRelations];
      mockRepository.findAll.mockResolvedValue(orgs);
      mockRepository.findHelpTypesByOrganizationIds.mockResolvedValue([]);
      mockS3Service.getImageUrls.mockReturnValue([]);

      const result = await service.findAll();

      expect(result[0].latitude).toBe(55.7558);
      expect(result[0].longitude).toBe(37.6173);
    });

    it('should handle null coordinates', async () => {
      const orgs = [{ ...mockOrganizationWithRelations, latitude: null, longitude: null }];
      mockRepository.findAll.mockResolvedValue(orgs);
      mockRepository.findHelpTypesByOrganizationIds.mockResolvedValue([]);
      mockS3Service.getImageUrls.mockReturnValue([]);

      const result = await service.findAll();

      expect(result[0].latitude).toBeNull();
      expect(result[0].longitude).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return organization with relations', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrganizationWithRelations);
      mockRepository.findHelpTypesByOrganizationId.mockResolvedValue([mockHelpTypeRelation]);
      mockRepository.findOwnersByOrganizationId.mockResolvedValue([mockOwner]);
      mockS3Service.getImageUrls.mockReturnValue(['http://example.com/image1.jpg']);

      const result = await service.findOne(1);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('helpTypes');
      expect(result).toHaveProperty('owners');
      expect(result.helpTypes).toEqual([mockHelpTypeRelation]);
      expect(result.owners).toEqual([mockOwner]);
      expect(mockRepository.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(undefined);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Организация с ID 999 не найдена');
    });

    it('should return organization without city when city is deleted', async () => {
      const orgWithoutCity = { ...mockOrganizationWithRelations, cityName: null };
      mockRepository.findOne.mockResolvedValue(orgWithoutCity);
      mockRepository.findHelpTypesByOrganizationId.mockResolvedValue([]);
      mockRepository.findOwnersByOrganizationId.mockResolvedValue([]);
      mockS3Service.getImageUrls.mockReturnValue([]);

      const result = await service.findOne(1);

      expect(result.city).toBeNull();
    });
  });

  describe('update', () => {
    const updateDto: UpdateOrganizationDto = {
      name: 'Обновленное название',
      summary: 'Новое описание',
    };

    it('should successfully update organization', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      mockRepository.update.mockResolvedValue({ ...mockOrganization, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(result).toHaveProperty('name', 'Обновленное название');
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDto)).rejects.toThrow('Организация с ID 999 не найдена');
    });

    it('should validate city when cityId is updated', async () => {
      const updateWithCity: UpdateOrganizationDto = {
        cityId: 2,
      };

      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[{ ...mockCity, id: 2 }]]);
      mockRepository.update.mockResolvedValue({ ...mockOrganization, cityId: 2 });

      await service.update(1, updateWithCity);

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should throw NotFoundException when new city does not exist', async () => {
      const updateWithCity: UpdateOrganizationDto = {
        cityId: 999,
      };

      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[]]);

      await expect(service.update(1, updateWithCity)).rejects.toThrow(NotFoundException);
      await expect(service.update(1, updateWithCity)).rejects.toThrow('Город с ID 999 не найден');
    });

    it('should update help types when helpTypeIds is provided', async () => {
      const updateWithHelpTypes: UpdateOrganizationDto = {
        helpTypeIds: [1, 2],
      };

      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[mockHelpType, { ...mockHelpType, id: 2 }]]);
      mockRepository.removeAllHelpTypes.mockResolvedValue(undefined);
      mockRepository.addHelpTypes.mockResolvedValue(undefined);
      mockRepository.update.mockResolvedValue(mockOrganization);

      await service.update(1, updateWithHelpTypes);

      expect(mockRepository.removeAllHelpTypes).toHaveBeenCalledWith(1);
      expect(mockRepository.addHelpTypes).toHaveBeenCalledWith(1, [1, 2]);
    });

    it('should delete unused gallery files from S3', async () => {
      const updateWithGallery: UpdateOrganizationDto = {
        gallery: ['organizations/1/image2.jpg'],
      };

      mockRepository.findById.mockResolvedValue(mockOrganization);
      mockS3Service.deleteFiles.mockResolvedValue(undefined);
      mockRepository.update.mockResolvedValue({ ...mockOrganization, gallery: ['organizations/1/image2.jpg'] });

      await service.update(1, updateWithGallery);

      expect(mockS3Service.deleteFiles).toHaveBeenCalledWith(['organizations/1/image1.jpg']);
    });

    it('should handle S3 deletion errors gracefully', async () => {
      const updateWithGallery: UpdateOrganizationDto = {
        gallery: ['organizations/1/image2.jpg'],
      };

      mockRepository.findById.mockResolvedValue(mockOrganization);
      mockS3Service.deleteFiles.mockRejectedValue(new Error('S3 error'));
      mockRepository.update.mockResolvedValue({ ...mockOrganization, gallery: ['organizations/1/image2.jpg'] });

      // Не должно выбрасывать ошибку
      await service.update(1, updateWithGallery);

      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should validate organization type when organizationTypeId is updated', async () => {
      const updateWithType: UpdateOrganizationDto = {
        organizationTypeId: 2,
      };

      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[{ ...mockOrganizationType, id: 2 }]]);
      mockRepository.update.mockResolvedValue({ ...mockOrganization, organizationTypeId: 2 });

      await service.update(1, updateWithType);

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should throw BadRequestException when organizationTypeId is invalid', async () => {
      const updateWithInvalidType: UpdateOrganizationDto = {
        organizationTypeId: -1,
      };

      mockRepository.findById.mockResolvedValue(mockOrganization);

      await expect(service.update(1, updateWithInvalidType)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateWithInvalidType)).rejects.toThrow(
        'ID типа организации должен быть положительным целым числом'
      );
    });
  });

  describe('approveOrganization', () => {
    it('should successfully approve organization', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockOrganization, isApproved: false });
      mockRepository.updateApprovalStatus.mockResolvedValue({ ...mockOrganization, isApproved: true });

      const result = await service.approveOrganization(1);

      expect(result.isApproved).toBe(true);
      expect(mockRepository.updateApprovalStatus).toHaveBeenCalledWith(1, true);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.approveOrganization(999)).rejects.toThrow(NotFoundException);
      await expect(service.approveOrganization(999)).rejects.toThrow('Организация с ID 999 не найдена');
    });

    it('should throw BadRequestException when organization is already approved', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockOrganization, isApproved: true });

      await expect(service.approveOrganization(1)).rejects.toThrow(BadRequestException);
      await expect(service.approveOrganization(1)).rejects.toThrow('Организация с ID 1 уже подтверждена');
    });
  });

  describe('disapproveOrganization', () => {
    it('should successfully disapprove organization', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockOrganization, isApproved: true });
      mockRepository.updateApprovalStatus.mockResolvedValue({ ...mockOrganization, isApproved: false });

      const result = await service.disapproveOrganization(1);

      expect(result.isApproved).toBe(false);
      expect(mockRepository.updateApprovalStatus).toHaveBeenCalledWith(1, false);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.disapproveOrganization(999)).rejects.toThrow(NotFoundException);
      await expect(service.disapproveOrganization(999)).rejects.toThrow('Организация с ID 999 не найдена');
    });

    it('should throw BadRequestException when organization is not approved', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockOrganization, isApproved: false });

      await expect(service.disapproveOrganization(1)).rejects.toThrow(BadRequestException);
      await expect(service.disapproveOrganization(1)).rejects.toThrow(
        'Организация с ID 1 не подтверждена, отмена невозможна'
      );
    });
  });

  describe('remove', () => {
    it('should successfully remove organization', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      mockRepository.removeAllHelpTypes.mockResolvedValue(undefined);
      mockRepository.removeAllOwners.mockResolvedValue(undefined);
      mockS3Service.deleteFiles.mockResolvedValue(undefined);
      mockRepository.softDelete.mockResolvedValue({ ...mockOrganization, recordStatus: 'DELETED' });

      const result = await service.remove(1);

      expect(result.recordStatus).toBe('DELETED');
      expect(mockRepository.removeAllHelpTypes).toHaveBeenCalledWith(1);
      expect(mockRepository.removeAllOwners).toHaveBeenCalledWith(1);
      expect(mockS3Service.deleteFiles).toHaveBeenCalledWith(mockOrganization.gallery);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow('Организация с ID 999 не найдена');
    });

    it('should handle organization without gallery', async () => {
      const orgWithoutGallery = { ...mockOrganization, gallery: null };
      mockRepository.findById.mockResolvedValue(orgWithoutGallery);
      mockRepository.removeAllHelpTypes.mockResolvedValue(undefined);
      mockRepository.removeAllOwners.mockResolvedValue(undefined);
      mockRepository.softDelete.mockResolvedValue({ ...orgWithoutGallery, recordStatus: 'DELETED' });

      await service.remove(1);

      expect(mockS3Service.deleteFiles).not.toHaveBeenCalled();
    });

    it('should handle S3 deletion errors gracefully', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      mockRepository.removeAllHelpTypes.mockResolvedValue(undefined);
      mockRepository.removeAllOwners.mockResolvedValue(undefined);
      mockS3Service.deleteFiles.mockRejectedValue(new Error('S3 error'));
      mockRepository.softDelete.mockResolvedValue({ ...mockOrganization, recordStatus: 'DELETED' });

      // Не должно выбрасывать ошибку
      await service.remove(1);

      expect(mockRepository.softDelete).toHaveBeenCalled();
    });
  });

  describe('addOwner', () => {
    it('should successfully add owner to organization', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[mockUser]]);
      mockRepository.findOwner.mockResolvedValue(undefined);
      mockRepository.addOwner.mockResolvedValue(undefined);

      const result = await service.addOwner(1, 1);

      expect(result).toEqual({ message: 'Владелец успешно добавлен' });
      expect(mockRepository.addOwner).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.addOwner(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.addOwner(999, 1)).rejects.toThrow('Организация с ID 999 не найдена');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[]]);

      await expect(service.addOwner(1, 999)).rejects.toThrow(NotFoundException);
      await expect(service.addOwner(1, 999)).rejects.toThrow('Пользователь с ID 999 не найден');
    });

    it('should throw ConflictException when owner already exists', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[mockUser]]);
      mockRepository.findOwner.mockResolvedValue({ organizationId: 1, userId: 1 });

      await expect(service.addOwner(1, 1)).rejects.toThrow(new ConflictException('Пользователь уже является владельцем организации'));
    });
  });

  describe('removeOwner', () => {
    it('should successfully remove owner from organization', async () => {
      mockRepository.removeOwner.mockResolvedValue(true);

      const result = await service.removeOwner(1, 1);

      expect(result).toEqual({ message: 'Владелец успешно удален' });
      expect(mockRepository.removeOwner).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when owner does not exist', async () => {
      mockRepository.removeOwner.mockResolvedValue(false);

      await expect(service.removeOwner(1, 999)).rejects.toThrow(NotFoundException);
      await expect(service.removeOwner(1, 999)).rejects.toThrow('Связь не найдена');
    });
  });

  describe('addHelpType', () => {
    it('should successfully add help type to organization', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[mockHelpType]]);
      mockRepository.findHelpType.mockResolvedValue(undefined);
      mockRepository.addHelpType.mockResolvedValue(undefined);

      const result = await service.addHelpType(1, 1);

      expect(result).toEqual({ message: 'Вид помощи успешно добавлен' });
      expect(mockRepository.addHelpType).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.addHelpType(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.addHelpType(999, 1)).rejects.toThrow('Организация с ID 999 не найдена');
    });

    it('should throw NotFoundException when help type does not exist', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[]]);

      await expect(service.addHelpType(1, 999)).rejects.toThrow(NotFoundException);
      await expect(service.addHelpType(1, 999)).rejects.toThrow('Вид помощи с ID 999 не найден');
    });

    it('should throw ConflictException when help type already exists', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);
      setupDbMock([[mockHelpType]]);
      mockRepository.findHelpType.mockResolvedValue({ organizationId: 1, helpTypeId: 1 });

      await expect(service.addHelpType(1, 1)).rejects.toThrow(new ConflictException('Вид помощи уже добавлен к организации'));
    });
  });

  describe('removeHelpType', () => {
    it('should successfully remove help type from organization', async () => {
      mockRepository.removeHelpType.mockResolvedValue(true);

      const result = await service.removeHelpType(1, 1);

      expect(result).toEqual({ message: 'Вид помощи успешно удален' });
      expect(mockRepository.removeHelpType).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when help type does not exist', async () => {
      mockRepository.removeHelpType.mockResolvedValue(false);

      await expect(service.removeHelpType(1, 999)).rejects.toThrow(NotFoundException);
      await expect(service.removeHelpType(1, 999)).rejects.toThrow('Связь не найдена');
    });
  });

  describe('addImagesToGallery', () => {
    it('should successfully add images to gallery', async () => {
      const imageFileNames = ['organizations/1/image2.jpg'];
      mockRepository.findById.mockResolvedValue(mockOrganization);
      mockRepository.updateGallery.mockResolvedValue({
        ...mockOrganization,
        gallery: [...(mockOrganization.gallery || []), ...imageFileNames],
      });

      const result = await service.addImagesToGallery(1, imageFileNames);

      expect(result.gallery).toContain('organizations/1/image2.jpg');
      expect(mockRepository.updateGallery).toHaveBeenCalled();
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.addImagesToGallery(999, ['image.jpg'])).rejects.toThrow(NotFoundException);
      await expect(service.addImagesToGallery(999, ['image.jpg'])).rejects.toThrow(
        'Организация с ID 999 не найдена'
      );
    });

    it('should handle organization without existing gallery', async () => {
      const orgWithoutGallery = { ...mockOrganization, gallery: null };
      const imageFileNames = ['organizations/1/image1.jpg'];
      mockRepository.findById.mockResolvedValue(orgWithoutGallery);
      mockRepository.updateGallery.mockResolvedValue({
        ...orgWithoutGallery,
        gallery: imageFileNames,
      });

      await service.addImagesToGallery(1, imageFileNames);

      expect(mockRepository.updateGallery).toHaveBeenCalledWith(1, imageFileNames);
    });
  });

  describe('checkImageInGallery', () => {
    it('should return true when image exists in gallery', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);

      const result = await service.checkImageInGallery(1, 'organizations/1/image1.jpg');

      expect(result).toBe(true);
    });

    it('should return false when image does not exist in gallery', async () => {
      mockRepository.findById.mockResolvedValue(mockOrganization);

      const result = await service.checkImageInGallery(1, 'organizations/1/other-image.jpg');

      expect(result).toBe(false);
    });

    it('should return false when organization does not exist', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      const result = await service.checkImageInGallery(999, 'organizations/1/image1.jpg');

      expect(result).toBe(false);
    });

    it('should return false when gallery is empty', async () => {
      const orgWithoutGallery = { ...mockOrganization, gallery: null };
      mockRepository.findById.mockResolvedValue(orgWithoutGallery);

      const result = await service.checkImageInGallery(1, 'organizations/1/image1.jpg');

      expect(result).toBe(false);
    });
  });

  describe('createMany', () => {
    const createBulkDto: CreateOrganizationsBulkDto = [
      {
        name: 'Организация 1',
        cityId: 1,
        typeId: 1,
        helpTypeIds: [1],
        address: 'г. Москва',
      },
      {
        name: 'Организация 2',
        cityId: 0,
        typeId: 1,
        helpTypeIds: [1],
        address: 'г. Москва',
      },
    ];

    it('should successfully create multiple organizations', async () => {
      // Порядок вызовов:
      // 1. user
      // 2. cities для cityId = 1
      // 3. findCityByName('Москва') - точное совпадение
      // 4. organizationTypes
      // 5. helpTypes
      // 6. citiesData для всех городов (cityId = 1 и найденный по имени)
      setupDbMock([
        [mockUser],           // 1. проверка пользователя
        [mockCity],           // 2. проверка городов по cityId
        [mockCity],           // 3. findCityByName - точное совпадение
        [mockOrganizationType], // 4. проверка типов организаций
        [mockHelpType],       // 5. проверка видов помощи
        [mockCity],           // 6. получение данных городов для координат
      ]);
      mockRepository.createMany.mockResolvedValue([
        { ...mockOrganization, id: 1 },
        { ...mockOrganization, id: 2 },
      ]);
      mockRepository.addOwnersToOrganizations.mockResolvedValue(undefined);
      mockRepository.addHelpTypes.mockResolvedValue(undefined);

      const result = await service.createMany(createBulkDto, 1);

      expect(result).toHaveLength(2);
      expect(mockRepository.createMany).toHaveBeenCalled();
      expect(mockRepository.addOwnersToOrganizations).toHaveBeenCalled();
    });

    it('should throw BadRequestException when array is empty', async () => {
      await expect(service.createMany([], 1)).rejects.toThrow(new BadRequestException('Массив организаций не может быть пустым'));
    });

    it('should throw NotFoundException when user does not exist', async () => {
      setupDbMock([[]]);

      await expect(service.createMany(createBulkDto, 999)).rejects.toThrow(new NotFoundException('Пользователь с ID 999 не найден'));
    });

    it('should throw NotFoundException when city does not exist', async () => {
      // Порядок: user, cities (для cityId), organizationTypes, helpTypes, cities (для координат)
      setupDbMock([[mockUser], [], [mockOrganizationType], [mockHelpType], []]);

      await expect(service.createMany(createBulkDto, 1)).rejects.toThrow(new NotFoundException('Города с ID 1 не найдены'));
    });

    it('should find city by name when cityId is 0', async () => {
      const dtoWithCityName: CreateOrganizationsBulkDto = [
        {
          name: 'Организация',
          cityId: 0,
          typeId: 1,
          helpTypeIds: [1],
          address: 'г. Москва',
        },
      ];

      // Порядок вызовов:
      // 1. user
      // 2. findCityByName('Москва') - точное совпадение (найдено)
      // 3. organizationTypes
      // 4. helpTypes
      // 5. citiesData для координат
      setupDbMock([
        [mockUser],           // 1. проверка пользователя
        [mockCity],           // 2. findCityByName - точное совпадение (для cityId = 0)
        [mockOrganizationType], // 3. проверка типов организаций
        [mockHelpType],       // 4. проверка видов помощи
        [mockCity],           // 5. получение данных городов для координат
      ]);
      mockRepository.createMany.mockResolvedValue([mockOrganization]);
      mockRepository.addOwnersToOrganizations.mockResolvedValue(undefined);
      mockRepository.addHelpTypes.mockResolvedValue(undefined);

      await service.createMany(dtoWithCityName, 1);

      expect(mockRepository.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when city name not found', async () => {
      const dtoWithUnknownCity: CreateOrganizationsBulkDto = [
        {
          name: 'Организация',
          cityId: 0,
          typeId: 1,
          helpTypeIds: [1],
          address: 'г. Неизвестный город',
        },
      ];

      // Порядок: user, findCityByName - точное совпадение (не найдено), 
      // findCityByName - частичное совпадение (не найдено), затем ошибка
      // При cityId = 0 проверка городов по ID не выполняется (cityIds.size = 0)
      setupDbMock([
        [mockUser],           // 1. проверка пользователя
        [],                   // 2. findCityByName - точное совпадение (не найдено)
        [],                   // 3. findCityByName - частичное совпадение (не найдено)
        // Ошибка выбрасывается здесь, дальше не доходит
      ]);

      await expect(service.createMany(dtoWithUnknownCity, 1)).rejects.toThrow(
        new NotFoundException('Город "Неизвестный город" не найден в базе данных')
      );
    });

    it('should throw NotFoundException when organization type does not exist', async () => {
      // Порядок: user, cities (для cityId = 1), findCityByName для cityId = 0, organizationTypes, helpTypes, cities (для координат)
      setupDbMock([
        [mockUser],           // 1. проверка пользователя
        [mockCity],           // 2. проверка городов по cityId = 1
        [mockCity],           // 3. findCityByName для cityId = 0 (точное совпадение)
        [],                   // 4. проверка типов организаций (не найдено)
        [mockHelpType],       // 5. проверка видов помощи (не доходит)
      ]);

      await expect(service.createMany(createBulkDto, 1)).rejects.toThrow(new NotFoundException('Типы организаций с ID 1 не найдены'));
    });

    it('should throw NotFoundException when help type does not exist', async () => {
      // Порядок: user, cities (для cityId = 1), findCityByName для cityId = 0, organizationTypes, helpTypes
      // В createBulkDto есть две организации: одна с cityId = 1, другая с cityId = 0
      setupDbMock([
        [mockUser],           // 1. проверка пользователя
        [mockCity],           // 2. проверка городов по cityId = 1
        [mockCity],           // 3. findCityByName для cityId = 0 (точное совпадение)
        [mockOrganizationType], // 4. проверка типов организаций
        [],                   // 5. проверка видов помощи (не найдено)
      ]);

      await expect(service.createMany(createBulkDto, 1)).rejects.toThrow(new NotFoundException('Виды помощи с ID 1 не найдены'));
    });

    it('should use city coordinates when not provided', async () => {
      const dtoWithoutCoords: CreateOrganizationsBulkDto = [
        {
          name: 'Организация',
          cityId: 1,
          typeId: 1,
          helpTypeIds: [1],
          address: 'г. Москва',
        },
      ];

      setupDbMock([[mockUser], [mockCity], [mockOrganizationType], [mockHelpType], [mockCity]]);
      mockRepository.createMany.mockResolvedValue([mockOrganization]);
      mockRepository.addOwnersToOrganizations.mockResolvedValue(undefined);
      mockRepository.addHelpTypes.mockResolvedValue(undefined);

      await service.createMany(dtoWithoutCoords, 1);

      expect(mockRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            latitude: mockCity.latitude,
            longitude: mockCity.longitude,
          }),
        ])
      );
    });
  });
});

