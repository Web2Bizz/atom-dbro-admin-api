import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationController } from '../organization.controller';
import { OrganizationService } from '../organization.service';
import { S3Service } from '../s3.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { AddOwnerDto } from '../dto/add-owner.dto';
import { AddHelpTypeDto } from '../dto/add-help-type.dto';
import { CreateOrganizationsBulkDto } from '../dto/create-organizations-bulk.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let service: OrganizationService;
  let s3Service: S3Service;

  const mockUser = {
    userId: 1,
    email: 'admin@example.com',
  };

  const mockOrganization = {
    id: 1,
    name: 'Тестовая организация',
    cityId: 1,
    organizationTypeId: 1,
    latitude: 55.7558,
    longitude: 37.6173,
    summary: 'Краткое описание',
    mission: 'Миссия организации',
    description: 'Полное описание',
    goals: ['Цель 1', 'Цель 2'],
    needs: ['Нужда 1'],
    address: 'г. Москва, ул. Примерная, д. 1',
    contacts: [{ name: 'Телефон', value: '+7 (999) 123-45-67' }],
    gallery: ['http://example.com/image1.jpg'],
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    city: {
      id: 1,
      name: 'Москва',
      latitude: 55.7558,
      longitude: 37.6173,
    },
    type: {
      id: 1,
      name: 'Благотворительный фонд',
    },
    helpTypes: [
      { id: 1, name: 'Материальная помощь' },
    ],
    owners: [
      {
        id: 1,
        firstName: 'Иван',
        lastName: 'Иванов',
        middleName: null,
        email: 'ivan@example.com',
      },
    ],
  };

  const mockFile = {
    fieldname: 'images',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: '/tmp',
    filename: 'test.jpg',
    path: '/tmp/test.jpg',
    buffer: Buffer.from('test'),
  };

  let mockService: {
    create: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    approveOrganization: ReturnType<typeof vi.fn>;
    disapproveOrganization: ReturnType<typeof vi.fn>;
    addOwner: ReturnType<typeof vi.fn>;
    removeOwner: ReturnType<typeof vi.fn>;
    addHelpType: ReturnType<typeof vi.fn>;
    removeHelpType: ReturnType<typeof vi.fn>;
    addImagesToGallery: ReturnType<typeof vi.fn>;
    checkImageInGallery: ReturnType<typeof vi.fn>;
  };

  let mockS3Service: {
    uploadMultipleImages: ReturnType<typeof vi.fn>;
    getFile: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockService = {
      create: vi.fn(),
      createMany: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      approveOrganization: vi.fn(),
      disapproveOrganization: vi.fn(),
      addOwner: vi.fn(),
      removeOwner: vi.fn(),
      addHelpType: vi.fn(),
      removeHelpType: vi.fn(),
      addImagesToGallery: vi.fn(),
      checkImageInGallery: vi.fn(),
    };

    mockS3Service = {
      uploadMultipleImages: vi.fn(),
      getFile: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: mockService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: vi.fn(() => true),
      })
      .compile();

    controller = module.get<OrganizationController>(OrganizationController);
    service = module.get<OrganizationService>(OrganizationService);
    s3Service = module.get<S3Service>(S3Service);
    
    // Убеждаемся, что контроллер получил зависимости
    expect(controller).toBeDefined();
    expect(service).toBe(mockService);
    expect(s3Service).toBe(mockS3Service);
    
    // Проверяем, что зависимости внедрены в контроллер через рефлексию
    // В NestJS приватные поля доступны через рефлексию
    const controllerService = (controller as any).organizationService;
    const controllerS3Service = (controller as any).s3Service;
    
    if (!controllerService || !controllerS3Service) {
      // Если зависимости не внедрены, создаем контроллер вручную
      controller = new OrganizationController(mockService as any, mockS3Service as any);
    }
  });

  describe('create', () => {
    const createDto: CreateOrganizationDto = {
      name: 'Тестовая организация',
      cityId: 1,
      typeId: 1,
      helpTypeIds: [1],
    };

    it('should successfully create organization', async () => {
      mockService.create.mockResolvedValue(mockOrganization);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(mockOrganization);
      expect(mockService.create).toHaveBeenCalledWith(createDto, mockUser.userId);
    });

    it('should pass user id to service', async () => {
      mockService.create.mockResolvedValue(mockOrganization);

      await controller.create(createDto, mockUser);

      expect(mockService.create).toHaveBeenCalledWith(createDto, 1);
    });
  });

  describe('findAll', () => {
    it('should return all organizations without filter', async () => {
      mockService.findAll.mockResolvedValue([mockOrganization]);

      const result = await controller.findAll();

      expect(result).toEqual([mockOrganization]);
      expect(mockService.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should filter by approved status when filteredByStatus is "true"', async () => {
      mockService.findAll.mockResolvedValue([{ ...mockOrganization, isApproved: true }]);

      const result = await controller.findAll('true');

      expect(result).toEqual([{ ...mockOrganization, isApproved: true }]);
      expect(mockService.findAll).toHaveBeenCalledWith(true);
    });

    it('should filter by unapproved status when filteredByStatus is "false"', async () => {
      mockService.findAll.mockResolvedValue([{ ...mockOrganization, isApproved: false }]);

      const result = await controller.findAll('false');

      expect(result).toEqual([{ ...mockOrganization, isApproved: false }]);
      expect(mockService.findAll).toHaveBeenCalledWith(false);
    });

    it('should return all when filteredByStatus is invalid', async () => {
      mockService.findAll.mockResolvedValue([mockOrganization]);

      const result = await controller.findAll('invalid');

      expect(result).toEqual([mockOrganization]);
      expect(mockService.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findOne', () => {
    it('should return organization by id', async () => {
      mockService.findOne.mockResolvedValue(mockOrganization);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockOrganization);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException('Организация с ID 999 не найдена'));

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999)).rejects.toThrow('Организация с ID 999 не найдена');
    });
  });

  describe('update', () => {
    const updateDto: UpdateOrganizationDto = {
      name: 'Обновленное название',
    };

    it('should successfully update organization', async () => {
      const updatedOrg = { ...mockOrganization, ...updateDto };
      mockService.update.mockResolvedValue(updatedOrg);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedOrg);
      expect(mockService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockService.update.mockRejectedValue(new NotFoundException('Организация с ID 999 не найдена'));

      await expect(controller.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveOrganization', () => {
    it('should successfully approve organization', async () => {
      const approvedOrg = { ...mockOrganization, isApproved: true };
      mockService.approveOrganization.mockResolvedValue(approvedOrg);

      const result = await controller.approveOrganization(1);

      expect(result).toEqual(approvedOrg);
      expect(mockService.approveOrganization).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockService.approveOrganization.mockRejectedValue(
        new NotFoundException('Организация с ID 999 не найдена')
      );

      await expect(controller.approveOrganization(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when organization is already approved', async () => {
      mockService.approveOrganization.mockRejectedValue(
        new BadRequestException('Организация с ID 1 уже подтверждена')
      );

      await expect(controller.approveOrganization(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('disapproveOrganization', () => {
    it('should successfully disapprove organization', async () => {
      const unapprovedOrg = { ...mockOrganization, isApproved: false };
      mockService.disapproveOrganization.mockResolvedValue(unapprovedOrg);

      const result = await controller.disapproveOrganization(1);

      expect(result).toEqual(unapprovedOrg);
      expect(mockService.disapproveOrganization).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockService.disapproveOrganization.mockRejectedValue(
        new NotFoundException('Организация с ID 999 не найдена')
      );

      await expect(controller.disapproveOrganization(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when organization is not approved', async () => {
      mockService.disapproveOrganization.mockRejectedValue(
        new BadRequestException('Организация с ID 1 не подтверждена, отмена невозможна')
      );

      await expect(controller.disapproveOrganization(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should successfully remove organization', async () => {
      const deletedOrg = { ...mockOrganization, recordStatus: 'DELETED' };
      mockService.remove.mockResolvedValue(deletedOrg);

      const result = await controller.remove(1);

      expect(result).toEqual(deletedOrg);
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockService.remove.mockRejectedValue(new NotFoundException('Организация с ID 999 не найдена'));

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addOwner', () => {
    const addOwnerDto: AddOwnerDto = {
      userId: 2,
    };

    it('should successfully add owner to organization', async () => {
      mockService.addOwner.mockResolvedValue({ message: 'Владелец успешно добавлен' });

      const result = await controller.addOwner(1, addOwnerDto);

      expect(result).toEqual({ message: 'Владелец успешно добавлен' });
      expect(mockService.addOwner).toHaveBeenCalledWith(1, addOwnerDto.userId);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockService.addOwner.mockRejectedValue(
        new NotFoundException('Организация с ID 999 не найдена')
      );

      await expect(controller.addOwner(999, addOwnerDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeOwner', () => {
    it('should successfully remove owner from organization', async () => {
      mockService.removeOwner.mockResolvedValue({ message: 'Владелец успешно удален' });

      const result = await controller.removeOwner(1, 1);

      expect(result).toEqual({ message: 'Владелец успешно удален' });
      expect(mockService.removeOwner).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when owner does not exist', async () => {
      mockService.removeOwner.mockRejectedValue(new NotFoundException('Связь не найдена'));

      await expect(controller.removeOwner(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addHelpType', () => {
    const addHelpTypeDto: AddHelpTypeDto = {
      helpTypeId: 2,
    };

    it('should successfully add help type to organization', async () => {
      mockService.addHelpType.mockResolvedValue({ message: 'Вид помощи успешно добавлен' });

      const result = await controller.addHelpType(1, addHelpTypeDto);

      expect(result).toEqual({ message: 'Вид помощи успешно добавлен' });
      expect(mockService.addHelpType).toHaveBeenCalledWith(1, addHelpTypeDto.helpTypeId);
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      mockService.addHelpType.mockRejectedValue(
        new NotFoundException('Организация с ID 999 не найдена')
      );

      await expect(controller.addHelpType(999, addHelpTypeDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeHelpType', () => {
    it('should successfully remove help type from organization', async () => {
      mockService.removeHelpType.mockResolvedValue({ message: 'Вид помощи успешно удален' });

      const result = await controller.removeHelpType(1, 1);

      expect(result).toEqual({ message: 'Вид помощи успешно удален' });
      expect(mockService.removeHelpType).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundException when help type does not exist', async () => {
      mockService.removeHelpType.mockRejectedValue(new NotFoundException('Связь не найдена'));

      await expect(controller.removeHelpType(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadImages', () => {
    it('should successfully upload images to gallery', async () => {
      const files = [mockFile];
      const imageFileNames = ['organizations/1/image1.jpg'];
      const updatedOrg = { ...mockOrganization, gallery: imageFileNames };

      mockS3Service.uploadMultipleImages.mockResolvedValue(imageFileNames);
      mockService.addImagesToGallery.mockResolvedValue(updatedOrg);

      const result = await controller.uploadImages(1, files);

      expect(result).toEqual(updatedOrg);
      expect(mockS3Service.uploadMultipleImages).toHaveBeenCalledWith(files, 1);
      expect(mockService.addImagesToGallery).toHaveBeenCalledWith(1, imageFileNames);
    });

    it('should throw BadRequestException when no files provided', async () => {
      await expect(controller.uploadImages(1, [])).rejects.toThrow(BadRequestException);
      await expect(controller.uploadImages(1, [])).rejects.toThrow(
        'Необходимо загрузить хотя бы одно изображение'
      );
      expect(mockS3Service.uploadMultipleImages).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when file size exceeds limit', async () => {
      const largeFile = { ...mockFile, size: 11 * 1024 * 1024 }; // 11MB

      await expect(controller.uploadImages(1, [largeFile])).rejects.toThrow(BadRequestException);
      await expect(controller.uploadImages(1, [largeFile])).rejects.toThrow('превышает максимальный размер 10MB');
    });

    it('should throw BadRequestException when file type is invalid', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(controller.uploadImages(1, [invalidFile])).rejects.toThrow(BadRequestException);
      await expect(controller.uploadImages(1, [invalidFile])).rejects.toThrow('недопустимый тип');
    });

    it('should throw BadRequestException when file extension is invalid', async () => {
      const invalidFile = { ...mockFile, originalname: 'test.txt' };

      await expect(controller.uploadImages(1, [invalidFile])).rejects.toThrow(BadRequestException);
      await expect(controller.uploadImages(1, [invalidFile])).rejects.toThrow('недопустимое расширение');
    });

    it('should validate multiple files', async () => {
      const files = [
        mockFile,
        { ...mockFile, originalname: 'test2.png', mimetype: 'image/png' },
      ];
      const imageFileNames = ['organizations/1/image1.jpg', 'organizations/1/image2.png'];
      const updatedOrg = { ...mockOrganization, gallery: imageFileNames };

      mockS3Service.uploadMultipleImages.mockResolvedValue(imageFileNames);
      mockService.addImagesToGallery.mockResolvedValue(updatedOrg);

      const result = await controller.uploadImages(1, files);

      expect(result).toEqual(updatedOrg);
      expect(mockS3Service.uploadMultipleImages).toHaveBeenCalledWith(files, 1);
    });

    it('should throw BadRequestException when one of multiple files is invalid', async () => {
      const files = [
        mockFile,
        { ...mockFile, size: 11 * 1024 * 1024 }, // Один файл слишком большой
      ];

      await expect(controller.uploadImages(1, files)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getImage', () => {
    it('should successfully return image from gallery', async () => {
      const fileName = 'image1.jpg';
      const fullFileName = `organizations/1/${fileName}`;
      const mockFileData = {
        body: Buffer.from('image data'),
        contentType: 'image/jpeg',
      };

      mockService.checkImageInGallery.mockResolvedValue(true);
      mockS3Service.getFile.mockResolvedValue(mockFileData);

      const mockResponse = {
        setHeader: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      await controller.getImage(1, fileName, mockResponse);

      expect(mockService.checkImageInGallery).toHaveBeenCalledWith(1, fullFileName);
      expect(mockS3Service.getFile).toHaveBeenCalledWith(fullFileName);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Length', mockFileData.body.length);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000');
      expect(mockResponse.send).toHaveBeenCalledWith(mockFileData.body);
    });

    it('should throw NotFoundException when image not in gallery', async () => {
      const fileName = 'nonexistent.jpg';
      mockService.checkImageInGallery.mockResolvedValue(false);

      const mockResponse = {
        setHeader: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      await expect(controller.getImage(1, fileName, mockResponse)).rejects.toThrow(NotFoundException);
      await expect(controller.getImage(1, fileName, mockResponse)).rejects.toThrow(
        'Изображение не найдено в галерее организации'
      );
      expect(mockS3Service.getFile).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when file not found in S3', async () => {
      const fileName = 'image1.jpg';
      const fullFileName = `organizations/1/${fileName}`;

      mockService.checkImageInGallery.mockResolvedValue(true);
      mockS3Service.getFile.mockRejectedValue(new Error('File not found'));

      const mockResponse = {
        setHeader: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      await expect(controller.getImage(1, fileName, mockResponse)).rejects.toThrow(NotFoundException);
      await expect(controller.getImage(1, fileName, mockResponse)).rejects.toThrow(
        'Изображение не найдено в хранилище'
      );
    });

    it('should decode URL-encoded file names', async () => {
      const fileName = 'image%201.jpg';
      const decodedFileName = 'image 1.jpg';
      const fullFileName = `organizations/1/${decodedFileName}`;
      const mockFileData = {
        body: Buffer.from('image data'),
        contentType: 'image/jpeg',
      };

      mockService.checkImageInGallery.mockResolvedValue(true);
      mockS3Service.getFile.mockResolvedValue(mockFileData);

      const mockResponse = {
        setHeader: vi.fn(),
        send: vi.fn(),
      } as unknown as Response;

      await controller.getImage(1, fileName, mockResponse);

      expect(mockService.checkImageInGallery).toHaveBeenCalledWith(1, fullFileName);
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
        cityId: 1,
        typeId: 1,
        helpTypeIds: [1],
        address: 'г. Москва',
      },
    ];

    it('should successfully create multiple organizations', async () => {
      const createdOrgs = [
        { ...mockOrganization, id: 1, name: 'Организация 1' },
        { ...mockOrganization, id: 2, name: 'Организация 2' },
      ];
      mockService.createMany.mockResolvedValue(createdOrgs);

      const result = await controller.createMany(createBulkDto, mockUser);

      expect(result).toEqual(createdOrgs);
      expect(mockService.createMany).toHaveBeenCalledWith(createBulkDto, mockUser.userId);
    });

    it('should pass user id to service', async () => {
      const createdOrgs = [mockOrganization];
      mockService.createMany.mockResolvedValue(createdOrgs);

      await controller.createMany(createBulkDto, mockUser);

      expect(mockService.createMany).toHaveBeenCalledWith(createBulkDto, 1);
    });

    it('should throw BadRequestException when validation fails', async () => {
      mockService.createMany.mockRejectedValue(
        new BadRequestException('Массив организаций не может быть пустым')
      );

      await expect(controller.createMany([], mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when related entities not found', async () => {
      mockService.createMany.mockRejectedValue(
        new NotFoundException('Города с ID 999 не найдены')
      );

      await expect(controller.createMany(createBulkDto, mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});

