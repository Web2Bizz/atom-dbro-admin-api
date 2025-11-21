import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { regions, cities } from '../database/schema';
import { eq, ne, and } from 'drizzle-orm';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  async create(createRegionDto: CreateRegionDto) {
    const [region] = await this.db
      .insert(regions)
      .values(createRegionDto)
      .returning();
    return region;
  }

  async findAll() {
    return this.db.select().from(regions);
  }

  async findOne(id: number) {
    const [region] = await this.db
      .select()
      .from(regions)
      .where(and(
        eq(regions.id, id),
        ne(regions.recordStatus, 'DELETED')
      ));
    if (!region) {
      throw new NotFoundException(`Регион с ID ${id} не найден`);
    }
    return region;
  }

  async findCitiesByRegion(regionId: number) {
    return this.db
      .select()
      .from(cities)
      .where(and(
        eq(cities.regionId, regionId),
        ne(cities.recordStatus, 'DELETED')
      ));
  }

  async update(id: number, updateRegionDto: UpdateRegionDto) {
    const [region] = await this.db
      .update(regions)
      .set({ ...updateRegionDto, updatedAt: new Date() })
      .where(and(
        eq(regions.id, id),
        ne(regions.recordStatus, 'DELETED')
      ))
      .returning();
    if (!region) {
      throw new NotFoundException(`Регион с ID ${id} не найден`);
    }
    return region;
  }

  async remove(id: number) {
    const [region] = await this.db
      .update(regions)
      .set({ recordStatus: 'DELETED', updatedAt: new Date() })
      .where(and(
        eq(regions.id, id),
        ne(regions.recordStatus, 'DELETED')
      ))
      .returning();
    if (!region) {
      throw new NotFoundException(`Регион с ID ${id} не найден`);
    }
    return region;
  }
}

