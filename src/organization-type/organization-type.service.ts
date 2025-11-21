import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { organizationTypes } from '../database/schema';
import { eq, and, ne } from 'drizzle-orm';
import { CreateOrganizationTypeDto } from './dto/create-organization-type.dto';
import { UpdateOrganizationTypeDto } from './dto/update-organization-type.dto';

@Injectable()
export class OrganizationTypeService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  async create(createOrganizationTypeDto: CreateOrganizationTypeDto) {
    // Проверяем уникальность названия (исключая удаленные записи)
    const [existingOrganizationType] = await this.db
      .select()
      .from(organizationTypes)
      .where(and(
        eq(organizationTypes.name, createOrganizationTypeDto.name),
        ne(organizationTypes.recordStatus, 'DELETED')
      ));
    if (existingOrganizationType) {
      throw new BadRequestException('Тип организации с таким названием уже существует');
    }

    const [organizationType] = await this.db
      .insert(organizationTypes)
      .values(createOrganizationTypeDto)
      .returning();
    return organizationType;
  }

  async findAll() {
    return this.db.select().from(organizationTypes);
  }

  async findOne(id: number) {
    const [organizationType] = await this.db
      .select()
      .from(organizationTypes)
      .where(and(
        eq(organizationTypes.id, id),
        ne(organizationTypes.recordStatus, 'DELETED')
      ));
    if (!organizationType) {
      throw new NotFoundException(`Тип организации с ID ${id} не найден`);
    }
    return organizationType;
  }

  async update(id: number, updateOrganizationTypeDto: UpdateOrganizationTypeDto) {
    // Если обновляется название, проверяем уникальность (исключая удаленные записи)
    if (updateOrganizationTypeDto.name) {
      const [existingOrganizationType] = await this.db
        .select()
        .from(organizationTypes)
        .where(and(
          eq(organizationTypes.name, updateOrganizationTypeDto.name),
          ne(organizationTypes.id, id),
          ne(organizationTypes.recordStatus, 'DELETED')
        ));
      if (existingOrganizationType) {
        throw new BadRequestException('Тип организации с таким названием уже существует');
      }
    }

    const [organizationType] = await this.db
      .update(organizationTypes)
      .set({ ...updateOrganizationTypeDto, updatedAt: new Date() })
      .where(and(
        eq(organizationTypes.id, id),
        ne(organizationTypes.recordStatus, 'DELETED')
      ))
      .returning();
    if (!organizationType) {
      throw new NotFoundException(`Тип организации с ID ${id} не найден`);
    }
    return organizationType;
  }

  async remove(id: number) {
    const [organizationType] = await this.db
      .update(organizationTypes)
      .set({ recordStatus: 'DELETED', updatedAt: new Date() })
      .where(and(
        eq(organizationTypes.id, id),
        ne(organizationTypes.recordStatus, 'DELETED')
      ))
      .returning();
    if (!organizationType) {
      throw new NotFoundException(`Тип организации с ID ${id} не найден`);
    }
    return organizationType;
  }
}

