import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { cities, regions } from '../database/schema';
import { eq, inArray, ne, and } from 'drizzle-orm';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreateCitiesBulkDto } from './dto/create-cities-bulk.dto';

@Injectable()
export class CityService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  async create(createCityDto: CreateCityDto) {
    // Проверяем существование региона (исключая удаленные)
    const [region] = await this.db
      .select()
      .from(regions)
      .where(and(
        eq(regions.id, createCityDto.regionId),
        ne(regions.recordStatus, 'DELETED')
      ));
    if (!region) {
      throw new NotFoundException(`Регион с ID ${createCityDto.regionId} не найден`);
    }

    const [city] = await this.db
      .insert(cities)
      .values({
        name: createCityDto.name,
        latitude: createCityDto.latitude.toString(),
        longitude: createCityDto.longitude.toString(),
        regionId: createCityDto.regionId,
      })
      .returning();
    return city;
  }

  async findAll(regionId?: number) {
    const baseConditions = [];
    
    if (regionId) {
      baseConditions.push(eq(cities.regionId, regionId));
    }

    return this.db
      .select({
        id: cities.id,
        name: cities.name,
        latitude: cities.latitude,
        longitude: cities.longitude,
        regionId: cities.regionId,
        recordStatus: cities.recordStatus,
        region: {
          id: regions.id,
          name: regions.name,
        },
        createdAt: cities.createdAt,
        updatedAt: cities.updatedAt,
      })
      .from(cities)
      .leftJoin(regions, eq(cities.regionId, regions.id))
      .where(baseConditions.length > 0 ? and(...baseConditions) : undefined);
  }

  async findOne(id: number) {
    const [city] = await this.db
      .select({
        id: cities.id,
        name: cities.name,
        latitude: cities.latitude,
        longitude: cities.longitude,
        regionId: cities.regionId,
        region: {
          id: regions.id,
          name: regions.name,
        },
        createdAt: cities.createdAt,
        updatedAt: cities.updatedAt,
      })
      .from(cities)
      .leftJoin(regions, eq(cities.regionId, regions.id))
      .where(and(
        eq(cities.id, id),
        ne(cities.recordStatus, 'DELETED')
      ));
    if (!city) {
      throw new NotFoundException(`Город с ID ${id} не найден`);
    }
    return city;
  }

  async update(id: number, updateCityDto: UpdateCityDto) {
    if (updateCityDto.regionId) {
      const [region] = await this.db
        .select()
        .from(regions)
        .where(and(
          eq(regions.id, updateCityDto.regionId),
          ne(regions.recordStatus, 'DELETED')
        ));
      if (!region) {
        throw new NotFoundException(`Регион с ID ${updateCityDto.regionId} не найден`);
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (updateCityDto.name) updateData.name = updateCityDto.name;
    if (updateCityDto.latitude !== undefined)
      updateData.latitude = updateCityDto.latitude.toString();
    if (updateCityDto.longitude !== undefined)
      updateData.longitude = updateCityDto.longitude.toString();
    if (updateCityDto.regionId) updateData.regionId = updateCityDto.regionId;

    const [city] = await this.db
      .update(cities)
      .set(updateData)
      .where(and(
        eq(cities.id, id),
        ne(cities.recordStatus, 'DELETED')
      ))
      .returning();
    if (!city) {
      throw new NotFoundException(`Город с ID ${id} не найден`);
    }
    return city;
  }

  async remove(id: number) {
    const [city] = await this.db
      .update(cities)
      .set({ recordStatus: 'DELETED', updatedAt: new Date() })
      .where(and(
        eq(cities.id, id),
        ne(cities.recordStatus, 'DELETED')
      ))
      .returning();
    if (!city) {
      throw new NotFoundException(`Город с ID ${id} не найден`);
    }
    return city;
  }

  async createMany(createCitiesDto: CreateCitiesBulkDto) {
    if (createCitiesDto.length === 0) {
      throw new BadRequestException('Массив городов не может быть пустым');
    }

    // Получаем все уникальные regionId из запроса
    const regionIds = [...new Set(createCitiesDto.map(city => city.regionId))];

    // Проверяем существование всех регионов (исключая удаленные)
    const existingRegions = await this.db
      .select()
      .from(regions)
      .where(and(
        inArray(regions.id, regionIds),
        ne(regions.recordStatus, 'DELETED')
      ));

    const existingRegionIds = new Set(existingRegions.map(r => r.id));
    const missingRegionIds = regionIds.filter(id => !existingRegionIds.has(id));

    if (missingRegionIds.length > 0) {
      throw new NotFoundException(
        `Регионы с ID ${missingRegionIds.join(', ')} не найдены`
      );
    }

    // Подготавливаем данные для вставки
    const citiesToInsert = createCitiesDto.map(city => ({
      name: city.name,
      latitude: city.latitude.toString(),
      longitude: city.longitude.toString(),
      regionId: city.regionId,
    }));

    // Вставляем все города одним запросом
    const insertedCities = await this.db
      .insert(cities)
      .values(citiesToInsert)
      .returning();

    return insertedCities;
  }
}

