import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  users,
  helpTypes,
  cities,
  organizationTypes,
} from '../database/schema';
import { and, inArray, ilike, ne, eq } from 'drizzle-orm';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateOrganizationsBulkDto } from './dto/create-organizations-bulk.dto';
import { S3Service } from './s3.service';
import { OrganizationRepository } from './organization.repository';
import { DATABASE_CONNECTION } from '../database/database.module';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    private repository: OrganizationRepository,
    private s3Service: S3Service,
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  /**
   * Преобразует координату в число
   * @param coord - координата (может быть строкой или числом)
   * @returns число или null
   */
  private parseCoordinate(coord: string | number | null | undefined): number | null {
    if (coord === null || coord === undefined) return null;
    const parsed = typeof coord === 'string' ? parseFloat(coord) : coord;
    return isNaN(parsed) ? null : parsed;
  }

  async create(createOrganizationDto: CreateOrganizationDto, userId: number) {
    // Проверяем существование города (исключая удаленные)
    const [city] = await this.db
      .select()
      .from(cities)
      .where(and(
        eq(cities.id, createOrganizationDto.cityId),
        ne(cities.recordStatus, 'DELETED')
      ));
    if (!city) {
      throw new NotFoundException(`Город с ID ${createOrganizationDto.cityId} не найден`);
    }

    // Проверяем существование типа организации (исключая удаленные)
    const [orgType] = await this.db
      .select()
      .from(organizationTypes)
      .where(and(
        eq(organizationTypes.id, createOrganizationDto.typeId),
        ne(organizationTypes.recordStatus, 'DELETED')
      ));
    if (!orgType) {
      throw new NotFoundException(`Тип организации с ID ${createOrganizationDto.typeId} не найден`);
    }

    // Проверяем существование видов помощи (исключая удаленные)
    const helpTypeIds = [...new Set(createOrganizationDto.helpTypeIds)]; // Убеждаемся в уникальности
    const existingHelpTypes = await this.db
      .select()
      .from(helpTypes)
      .where(and(
        inArray(helpTypes.id, helpTypeIds),
        ne(helpTypes.recordStatus, 'DELETED')
      ));
    if (existingHelpTypes.length !== helpTypeIds.length) {
      const foundIds = existingHelpTypes.map(ht => ht.id);
      const missingIds = helpTypeIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Виды помощи с ID ${missingIds.join(', ')} не найдены`);
    }

    // Проверяем существование пользователя (исключая удаленные)
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        ne(users.recordStatus, 'DELETED')
      ));
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    // Используем координаты из города, если не указаны
    const latitude = createOrganizationDto.latitude !== undefined
      ? createOrganizationDto.latitude.toString()
      : city.latitude;
    const longitude = createOrganizationDto.longitude !== undefined
      ? createOrganizationDto.longitude.toString()
      : city.longitude;

    // Создаем организацию
    const organization = await this.repository.create({
      name: createOrganizationDto.name,
      cityId: createOrganizationDto.cityId,
      organizationTypeId: createOrganizationDto.typeId,
      latitude: latitude,
      longitude: longitude,
      summary: createOrganizationDto.summary,
      mission: createOrganizationDto.mission,
      description: createOrganizationDto.description,
      goals: createOrganizationDto.goals,
      needs: createOrganizationDto.needs,
      address: createOrganizationDto.address,
      contacts: createOrganizationDto.contacts,
      gallery: createOrganizationDto.gallery,
    });

    // Автоматически назначаем создателя как владельца
    await this.repository.addOwner(organization.id, userId);

    // Добавляем виды помощи
    if (helpTypeIds.length > 0) {
      await this.repository.addHelpTypes(organization.id, helpTypeIds);
    }

    return organization;
  }

  async findAll() {
    try {
      const orgs = await this.repository.findAll();

      // Получаем helpTypes для всех организаций
      const orgIds = orgs.map(org => org.id);
      const allHelpTypes = await this.repository.findHelpTypesByOrganizationIds(orgIds);

      // Группируем helpTypes по organizationId
      const helpTypesByOrgId = new Map<number, Array<{ id: number; name: string }>>();
      for (const helpType of allHelpTypes) {
        if (!helpTypesByOrgId.has(helpType.organizationId)) {
          helpTypesByOrgId.set(helpType.organizationId, []);
        }
        helpTypesByOrgId.get(helpType.organizationId)!.push({
          id: helpType.id,
          name: helpType.name,
        });
      }

      return orgs.map(org => ({
        id: org.id,
        name: org.name,
        latitude: this.parseCoordinate(org.latitude),
        longitude: this.parseCoordinate(org.longitude),
        summary: org.summary,
        mission: org.mission,
        description: org.description,
        goals: org.goals,
        needs: org.needs,
        address: org.address,
        contacts: org.contacts,
        gallery: org.gallery ? this.s3Service.getImageUrls(org.gallery) : [],
        isApproved: org.isApproved,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        city: org.cityName && org.cityRecordStatus && org.cityRecordStatus !== 'DELETED' ? {
          id: org.cityId,
          name: org.cityName,
          latitude: this.parseCoordinate(org.cityLatitude),
          longitude: this.parseCoordinate(org.cityLongitude),
        } : null,
        type: org.organizationTypeName && org.organizationTypeRecordStatus && org.organizationTypeRecordStatus !== 'DELETED' ? {
          id: org.organizationTypeId,
          name: org.organizationTypeName,
        } : null,
        helpTypes: helpTypesByOrgId.get(org.id) || [],
      }));
    } catch (error: any) {
      this.logger.error('Ошибка в findAll:', error);
      this.logger.error('Детали ошибки:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail,
        hint: error?.hint,
        where: error?.where,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async findOne(id: number) {
    const orgData = await this.repository.findOne(id);
    if (!orgData) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }

    // Получаем виды помощи
    const orgHelpTypes = await this.repository.findHelpTypesByOrganizationId(id);

    const organization = {
      id: orgData.id,
      name: orgData.name,
      latitude: this.parseCoordinate(orgData.latitude),
      longitude: this.parseCoordinate(orgData.longitude),
      summary: orgData.summary,
      mission: orgData.mission,
      description: orgData.description,
      goals: orgData.goals,
      needs: orgData.needs,
      address: orgData.address,
      contacts: orgData.contacts,
      gallery: orgData.gallery ? this.s3Service.getImageUrls(orgData.gallery) : [],
      isApproved: orgData.isApproved,
      createdAt: orgData.createdAt,
      updatedAt: orgData.updatedAt,
      city: orgData.cityName ? {
        id: orgData.cityId,
        name: orgData.cityName,
        latitude: this.parseCoordinate(orgData.cityLatitude),
        longitude: this.parseCoordinate(orgData.cityLongitude),
      } : null,
      type: orgData.organizationTypeName ? {
        id: orgData.organizationTypeId,
        name: orgData.organizationTypeName,
      } : null,
      helpTypes: orgHelpTypes,
    };

    // Получаем владельцев
    const owners = await this.repository.findOwnersByOrganizationId(id);

    return {
      ...organization,
      owners,
    };
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    // Проверяем существование организации (исключая удаленные)
    const existingOrg = await this.repository.findById(id);
    if (!existingOrg) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }

    // Если обновляется cityId, проверяем существование города (исключая удаленные)
    if (updateOrganizationDto.cityId) {
      const [city] = await this.db
        .select()
        .from(cities)
        .where(and(
          eq(cities.id, updateOrganizationDto.cityId),
          ne(cities.recordStatus, 'DELETED')
        ));
      if (!city) {
        throw new NotFoundException(`Город с ID ${updateOrganizationDto.cityId} не найден`);
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (updateOrganizationDto.name) updateData.name = updateOrganizationDto.name;
    if (updateOrganizationDto.cityId !== undefined) updateData.cityId = updateOrganizationDto.cityId;
    if (updateOrganizationDto.latitude !== undefined)
      updateData.latitude = updateOrganizationDto.latitude.toString();
    if (updateOrganizationDto.longitude !== undefined)
      updateData.longitude = updateOrganizationDto.longitude.toString();
    if (updateOrganizationDto.summary !== undefined) updateData.summary = updateOrganizationDto.summary;
    if (updateOrganizationDto.mission !== undefined) updateData.mission = updateOrganizationDto.mission;
    if (updateOrganizationDto.description !== undefined) updateData.description = updateOrganizationDto.description;
    if (updateOrganizationDto.goals !== undefined) updateData.goals = updateOrganizationDto.goals;
    if (updateOrganizationDto.needs !== undefined) updateData.needs = updateOrganizationDto.needs;
    if (updateOrganizationDto.address !== undefined) updateData.address = updateOrganizationDto.address;
    if (updateOrganizationDto.contacts !== undefined) updateData.contacts = updateOrganizationDto.contacts;
    
    // Обработка organizationTypeId
    if (updateOrganizationDto.organizationTypeId !== undefined) {
      const organizationTypeId = Number(updateOrganizationDto.organizationTypeId);
      if (isNaN(organizationTypeId) || organizationTypeId <= 0) {
        throw new BadRequestException('ID типа организации должен быть положительным целым числом');
      }
      // Проверяем существование типа организации (исключая удаленные)
      const [orgType] = await this.db
        .select()
        .from(organizationTypes)
        .where(and(
          eq(organizationTypes.id, organizationTypeId),
          ne(organizationTypes.recordStatus, 'DELETED')
        ));
      if (!orgType) {
        throw new NotFoundException(`Тип организации с ID ${organizationTypeId} не найден`);
      }
      updateData.organizationTypeId = organizationTypeId;
    }

    // Обработка helpTypeIds: обновляем типы помощи организации
    if (updateOrganizationDto.helpTypeIds !== undefined) {
      const helpTypeIds = [...new Set(updateOrganizationDto.helpTypeIds)]; // Убеждаемся в уникальности
      
      // Проверяем существование всех видов помощи (исключая удаленные)
      if (helpTypeIds.length > 0) {
        const existingHelpTypes = await this.db
          .select()
          .from(helpTypes)
          .where(and(
            inArray(helpTypes.id, helpTypeIds),
            ne(helpTypes.recordStatus, 'DELETED')
          ));
        if (existingHelpTypes.length !== helpTypeIds.length) {
          const foundIds = existingHelpTypes.map(ht => ht.id);
          const missingIds = helpTypeIds.filter(id => !foundIds.includes(id));
          throw new NotFoundException(`Виды помощи с ID ${missingIds.join(', ')} не найдены`);
        }
      }

      // Удаляем все старые связи с видами помощи
      await this.repository.removeAllHelpTypes(id);

      // Добавляем новые связи с видами помощи
      if (helpTypeIds.length > 0) {
        await this.repository.addHelpTypes(id, helpTypeIds);
      }
    }

    // Обработка галереи: сравниваем старую и новую, удаляем неиспользуемые файлы из S3
    if (updateOrganizationDto.gallery !== undefined) {
      const oldGallery = existingOrg.gallery || [];
      const newGallery = updateOrganizationDto.gallery || [];

      // Находим файлы, которые были удалены (есть в старой галерее, но нет в новой)
      const filesToDelete = oldGallery.filter((fileName) => !newGallery.includes(fileName));

      // Удаляем неиспользуемые файлы из S3
      if (filesToDelete.length > 0) {
        try {
          await this.s3Service.deleteFiles(filesToDelete);
        } catch (error) {
          // Логируем ошибку, но не прерываем обновление организации
          this.logger.error(`Ошибка при удалении файлов из S3: ${error}`);
        }
      }

      updateData.gallery = newGallery;
    }

    const organization = await this.repository.update(id, updateData);
    if (!organization) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }
    return organization;
  }

  async approveOrganization(id: number) {
    // Проверяем существование организации (исключая удаленные)
    const existingOrg = await this.repository.findById(id);
    if (!existingOrg) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }

    // Проверяем, что организация еще не подтверждена
    if (existingOrg.isApproved) {
      throw new BadRequestException(`Организация с ID ${id} уже подтверждена`);
    }

    // Устанавливаем isApproved в true
    const organization = await this.repository.updateApprovalStatus(id, true);
    
    if (!organization) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }

    return organization;
  }

  async disapproveOrganization(id: number) {
    // Проверяем существование организации (исключая удаленные)
    const existingOrg = await this.repository.findById(id);
    if (!existingOrg) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }

    // Проверяем, что организация подтверждена (можно отменить только подтвержденную)
    if (!existingOrg.isApproved) {
      throw new BadRequestException(`Организация с ID ${id} не подтверждена, отмена невозможна`);
    }

    // Устанавливаем isApproved в false
    const organization = await this.repository.updateApprovalStatus(id, false);
    
    if (!organization) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }

    return organization;
  }

  async remove(id: number) {
    // Проверяем существование организации и получаем данные для удаления файлов (исключая удаленные)
    const organization = await this.repository.findById(id);
    if (!organization) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }

    // Удаляем связанные записи в organizationHelpTypes
    await this.repository.removeAllHelpTypes(id);

    // Удаляем связанные записи в organizationOwners
    await this.repository.removeAllOwners(id);

    // Удаляем файлы из S3, если они есть в галерее
    if (organization.gallery && organization.gallery.length > 0) {
      try {
        await this.s3Service.deleteFiles(organization.gallery);
      } catch (error) {
        // Логируем ошибку, но не прерываем удаление организации
        this.logger.error(`Ошибка при удалении файлов из S3: ${error}`);
      }
    }

    // Устанавливаем статус DELETED вместо физического удаления
    const deletedOrganization = await this.repository.softDelete(id);
    if (!deletedOrganization) {
      throw new NotFoundException(`Организация с ID ${id} не найдена`);
    }

    return deletedOrganization;
  }

  async addOwner(organizationId: number, userId: number) {
    // Проверяем существование организации (исключая удаленные)
    const organization = await this.repository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(`Организация с ID ${organizationId} не найдена`);
    }

    // Проверяем существование пользователя (исключая удаленные)
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        ne(users.recordStatus, 'DELETED')
      ));
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    // Проверяем, не является ли уже владельцем
    const existing = await this.repository.findOwner(organizationId, userId);
    if (existing) {
      throw new ConflictException('Пользователь уже является владельцем организации');
    }

    await this.repository.addOwner(organizationId, userId);

    return { message: 'Владелец успешно добавлен' };
  }

  async removeOwner(organizationId: number, userId: number) {
    const deleted = await this.repository.removeOwner(organizationId, userId);
    if (!deleted) {
      throw new NotFoundException('Связь не найдена');
    }
    return { message: 'Владелец успешно удален' };
  }

  async addHelpType(organizationId: number, helpTypeId: number) {
    // Проверяем существование организации (исключая удаленные)
    const organization = await this.repository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(`Организация с ID ${organizationId} не найдена`);
    }

    // Проверяем существование вида помощи (исключая удаленные)
    const [helpType] = await this.db
      .select()
      .from(helpTypes)
      .where(and(
        eq(helpTypes.id, helpTypeId),
        ne(helpTypes.recordStatus, 'DELETED')
      ));
    if (!helpType) {
      throw new NotFoundException(`Вид помощи с ID ${helpTypeId} не найден`);
    }

    // Проверяем, не добавлен ли уже вид помощи
    const existing = await this.repository.findHelpType(organizationId, helpTypeId);
    if (existing) {
      throw new ConflictException('Вид помощи уже добавлен к организации');
    }

    await this.repository.addHelpType(organizationId, helpTypeId);

    return { message: 'Вид помощи успешно добавлен' };
  }

  async removeHelpType(organizationId: number, helpTypeId: number) {
    const deleted = await this.repository.removeHelpType(organizationId, helpTypeId);
    if (!deleted) {
      throw new NotFoundException('Связь не найдена');
    }
    return { message: 'Вид помощи успешно удален' };
  }

  async addImagesToGallery(organizationId: number, imageFileNames: string[]) {
    // Проверяем существование организации (исключая удаленные)
    const organization = await this.repository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(`Организация с ID ${organizationId} не найдена`);
    }

    // Получаем текущую галерею или создаем пустой массив
    const currentGallery = organization.gallery || [];
    const updatedGallery = [...currentGallery, ...imageFileNames];

    // Обновляем галерею
    const updated = await this.repository.updateGallery(organizationId, updatedGallery);
    if (!updated) {
      throw new NotFoundException(`Организация с ID ${organizationId} не найдена`);
    }

    return updated;
  }

  /**
   * Проверяет, существует ли изображение в галерее организации
   * @param organizationId - ID организации
   * @param fileName - имя файла (ключ в S3)
   * @returns true, если файл есть в галерее
   */
  async checkImageInGallery(organizationId: number, fileName: string): Promise<boolean> {
    const organization = await this.repository.findById(organizationId);
    
    if (!organization) {
      return false;
    }

    const gallery = organization.gallery || [];
    return gallery.includes(fileName);
  }

  /**
   * Извлечь название города из адреса
   */
  private extractCityName(address: string | undefined): string | null {
    if (!address) return null;

    const trimmed = address.trim();
    const patterns = [
      /^г\.\s*(.+?)(?:,|$)/i,
      /^г\s+(.+?)(?:,|$)/i,
      /^(.+?)(?:,|$)/,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return trimmed;
  }

  /**
   * Найти город по названию
   */
  private async findCityByName(cityName: string): Promise<number | null> {
    if (!cityName) return null;

    const [exactMatch] = await this.db
      .select()
      .from(cities)
      .where(and(
        ilike(cities.name, cityName),
        ne(cities.recordStatus, 'DELETED')
      ));

    if (exactMatch) {
      return exactMatch.id;
    }

    const [partialMatch] = await this.db
      .select()
      .from(cities)
      .where(and(
        ilike(cities.name, `%${cityName}%`),
        ne(cities.recordStatus, 'DELETED')
      ));

    if (partialMatch) {
      return partialMatch.id;
    }

    return null;
  }

  async createMany(createOrganizationsDto: CreateOrganizationsBulkDto, userId: number) {
    if (createOrganizationsDto.length === 0) {
      throw new BadRequestException('Массив организаций не может быть пустым');
    }

    // Проверяем существование пользователя (исключая удаленные)
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        ne(users.recordStatus, 'DELETED')
      ));
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    // Собираем все уникальные cityId, typeId и helpTypeIds
    const cityIds = new Set<number>();
    const typeIds = new Set<number>();
    const helpTypeIds = new Set<number>();
    const cityNamesToResolve = new Map<number, string>(); // индекс в массиве -> название города

    createOrganizationsDto.forEach((org, index) => {
      if (org.cityId > 0) {
        cityIds.add(org.cityId);
      } else if (org.address) {
        // Если cityId = 0, пытаемся найти город по адресу
        const cityName = this.extractCityName(org.address);
        if (cityName) {
          cityNamesToResolve.set(index, cityName);
        }
      }
      typeIds.add(org.typeId);
      org.helpTypeIds.forEach(id => helpTypeIds.add(id));
    });

    // Проверяем существование всех городов (исключая удаленные)
    if (cityIds.size > 0) {
      const existingCities = await this.db
        .select()
        .from(cities)
        .where(and(
          inArray(cities.id, Array.from(cityIds)),
          ne(cities.recordStatus, 'DELETED')
        ));

      const existingCityIds = new Set(existingCities.map(c => c.id));
      const missingCityIds = Array.from(cityIds).filter(id => !existingCityIds.has(id));

      if (missingCityIds.length > 0) {
        throw new NotFoundException(`Города с ID ${missingCityIds.join(', ')} не найдены`);
      }
    }

    // Разрешаем города по названиям
    const cityNameToIdMap = new Map<string, number>();
    for (const [index, cityName] of cityNamesToResolve) {
      if (!cityNameToIdMap.has(cityName)) {
        const cityId = await this.findCityByName(cityName);
        if (!cityId) {
          throw new NotFoundException(`Город "${cityName}" не найден в базе данных`);
        }
        cityNameToIdMap.set(cityName, cityId);
      }
    }

    // Проверяем существование всех типов организаций (исключая удаленные)
    const existingTypes = await this.db
      .select()
      .from(organizationTypes)
      .where(and(
        inArray(organizationTypes.id, Array.from(typeIds)),
        ne(organizationTypes.recordStatus, 'DELETED')
      ));

    const existingTypeIds = new Set(existingTypes.map(t => t.id));
    const missingTypeIds = Array.from(typeIds).filter(id => !existingTypeIds.has(id));

    if (missingTypeIds.length > 0) {
      throw new NotFoundException(`Типы организаций с ID ${missingTypeIds.join(', ')} не найдены`);
    }

    // Проверяем существование всех видов помощи (исключая удаленные)
    if (helpTypeIds.size > 0) {
      const existingHelpTypes = await this.db
        .select()
        .from(helpTypes)
        .where(and(
          inArray(helpTypes.id, Array.from(helpTypeIds)),
          ne(helpTypes.recordStatus, 'DELETED')
        ));

      const existingHelpTypeIds = new Set(existingHelpTypes.map(ht => ht.id));
      const missingHelpTypeIds = Array.from(helpTypeIds).filter(id => !existingHelpTypeIds.has(id));

      if (missingHelpTypeIds.length > 0) {
        throw new NotFoundException(`Виды помощи с ID ${missingHelpTypeIds.join(', ')} не найдены`);
      }
    }

    // Получаем данные всех городов для использования координат по умолчанию (исключая удаленные)
    const allCityIds = new Set([...cityIds, ...cityNameToIdMap.values()]);
    const citiesData = allCityIds.size > 0
      ? await this.db
          .select()
          .from(cities)
          .where(and(
            inArray(cities.id, Array.from(allCityIds)),
            ne(cities.recordStatus, 'DELETED')
          ))
      : [];
    const citiesMap = new Map(citiesData.map(c => [c.id, c]));

    // Подготавливаем данные для вставки
    const organizationsToInsert = createOrganizationsDto.map((org, index) => {
      let finalCityId = org.cityId;
      if (finalCityId === 0) {
        if (cityNamesToResolve.has(index)) {
          const cityName = cityNamesToResolve.get(index)!;
          finalCityId = cityNameToIdMap.get(cityName)!;
        } else {
          throw new BadRequestException(`Для организации "${org.name}" cityId = 0, но не удалось найти город по адресу`);
        }
      }

      const city = citiesMap.get(finalCityId);
      if (!city) {
        throw new NotFoundException(`Город с ID ${finalCityId} не найден`);
      }

      const latitude = org.latitude !== undefined
        ? org.latitude.toString()
        : city.latitude;
      const longitude = org.longitude !== undefined
        ? org.longitude.toString()
        : city.longitude;

      return {
        name: org.name,
        cityId: finalCityId,
        organizationTypeId: org.typeId,
        latitude: latitude,
        longitude: longitude,
        summary: org.summary,
        mission: org.mission,
        description: org.description,
        goals: org.goals,
        needs: org.needs,
        address: org.address,
        contacts: org.contacts,
        gallery: org.gallery,
      };
    });

    // Вставляем все организации
    const insertedOrganizations = await this.repository.createMany(organizationsToInsert);

    // Назначаем пользователя владельцем всех организаций
    if (insertedOrganizations.length > 0) {
      const organizationIds = insertedOrganizations.map(org => org.id);
      await this.repository.addOwnersToOrganizations(organizationIds, userId);
    }

    // Добавляем связи с видами помощи
    for (let i = 0; i < insertedOrganizations.length; i++) {
      const org = createOrganizationsDto[i];
      const organizationId = insertedOrganizations[i].id;
      const uniqueHelpTypeIds = [...new Set(org.helpTypeIds)];

      if (uniqueHelpTypeIds.length > 0) {
        await this.repository.addHelpTypes(organizationId, uniqueHelpTypeIds);
      }
    }

    return insertedOrganizations;
  }
}

