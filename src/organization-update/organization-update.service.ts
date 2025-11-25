import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { organizationUpdates, organizations } from '../database/schema';
import { eq, ne, and } from 'drizzle-orm';
import { CreateOrganizationUpdateDto } from './dto/create-organization-update.dto';
import { UpdateOrganizationUpdateDto } from './dto/update-organization-update.dto';

@Injectable()
export class OrganizationUpdateService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  async create(createOrganizationUpdateDto: CreateOrganizationUpdateDto) {
    // Проверяем существование организации (исключая удаленные)
    const [organization] = await this.db
      .select()
      .from(organizations)
      .where(and(
        eq(organizations.id, createOrganizationUpdateDto.organizationId),
        ne(organizations.recordStatus, 'DELETED')
      ));
    if (!organization) {
      throw new NotFoundException(`Организация с ID ${createOrganizationUpdateDto.organizationId} не найдена`);
    }

    // Валидация фотографий (максимум 5 элементов)
    if (createOrganizationUpdateDto.photos && createOrganizationUpdateDto.photos.length > 5) {
      throw new BadRequestException('Максимум 5 фотографий');
    }

    const [organizationUpdate] = await this.db
      .insert(organizationUpdates)
      .values({
        organizationId: createOrganizationUpdateDto.organizationId,
        title: createOrganizationUpdateDto.title,
        text: createOrganizationUpdateDto.text,
        photos: createOrganizationUpdateDto.photos || [],
      })
      .returning();
    return organizationUpdate;
  }

  async findAll(organizationId?: number) {
    const conditions = [ne(organizationUpdates.recordStatus, 'DELETED')];
    if (organizationId) {
      conditions.push(eq(organizationUpdates.organizationId, organizationId));
    }
    return this.db
      .select()
      .from(organizationUpdates)
      .where(and(...conditions));
  }

  async findOne(id: number) {
    const [organizationUpdate] = await this.db
      .select()
      .from(organizationUpdates)
      .where(and(
        eq(organizationUpdates.id, id),
        ne(organizationUpdates.recordStatus, 'DELETED')
      ));
    if (!organizationUpdate) {
      throw new NotFoundException(`Обновление организации с ID ${id} не найдено`);
    }
    return organizationUpdate;
  }

  async update(id: number, updateOrganizationUpdateDto: UpdateOrganizationUpdateDto) {
    // Если обновляется organizationId, проверяем существование организации (исключая удаленные)
    if (updateOrganizationUpdateDto.organizationId !== undefined) {
      const [organization] = await this.db
        .select()
        .from(organizations)
        .where(and(
          eq(organizations.id, updateOrganizationUpdateDto.organizationId),
          ne(organizations.recordStatus, 'DELETED')
        ));
      if (!organization) {
        throw new NotFoundException(`Организация с ID ${updateOrganizationUpdateDto.organizationId} не найдена`);
      }
    }

    // Валидация фотографий (максимум 5 элементов)
    if (updateOrganizationUpdateDto.photos && updateOrganizationUpdateDto.photos.length > 5) {
      throw new BadRequestException('Максимум 5 фотографий');
    }

    const [organizationUpdate] = await this.db
      .update(organizationUpdates)
      .set({ ...updateOrganizationUpdateDto, updatedAt: new Date() })
      .where(and(
        eq(organizationUpdates.id, id),
        ne(organizationUpdates.recordStatus, 'DELETED')
      ))
      .returning();
    if (!organizationUpdate) {
      throw new NotFoundException(`Обновление организации с ID ${id} не найдено`);
    }
    return organizationUpdate;
  }

  async remove(id: number) {
    const [organizationUpdate] = await this.db
      .update(organizationUpdates)
      .set({ recordStatus: 'DELETED', updatedAt: new Date() })
      .where(and(
        eq(organizationUpdates.id, id),
        ne(organizationUpdates.recordStatus, 'DELETED')
      ))
      .returning();
    if (!organizationUpdate) {
      throw new NotFoundException(`Обновление организации с ID ${id} не найдено`);
    }
    return organizationUpdate;
  }
}

