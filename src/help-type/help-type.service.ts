import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { helpTypes } from '../database/schema';
import { eq, and, ne } from 'drizzle-orm';
import { CreateHelpTypeDto } from './dto/create-help-type.dto';
import { UpdateHelpTypeDto } from './dto/update-help-type.dto';

@Injectable()
export class HelpTypeService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  async create(createHelpTypeDto: CreateHelpTypeDto) {
    // Проверяем уникальность названия (исключая удаленные записи)
    const [existingHelpType] = await this.db
      .select()
      .from(helpTypes)
      .where(and(
        eq(helpTypes.name, createHelpTypeDto.name),
        ne(helpTypes.recordStatus, 'DELETED')
      ));
    if (existingHelpType) {
      throw new BadRequestException('Вид помощи с таким названием уже существует');
    }

    const [helpType] = await this.db
      .insert(helpTypes)
      .values(createHelpTypeDto)
      .returning();
    return helpType;
  }

  async findAll() {
    return this.db.select().from(helpTypes);
  }

  async findOne(id: number) {
    const [helpType] = await this.db
      .select()
      .from(helpTypes)
      .where(and(
        eq(helpTypes.id, id),
        ne(helpTypes.recordStatus, 'DELETED')
      ));
    if (!helpType) {
      throw new NotFoundException(`Вид помощи с ID ${id} не найден`);
    }
    return helpType;
  }

  async update(id: number, updateHelpTypeDto: UpdateHelpTypeDto) {
    // Если обновляется название, проверяем уникальность (исключая удаленные записи)
    if (updateHelpTypeDto.name) {
      const [existingHelpType] = await this.db
        .select()
        .from(helpTypes)
        .where(and(
          eq(helpTypes.name, updateHelpTypeDto.name),
          ne(helpTypes.id, id),
          ne(helpTypes.recordStatus, 'DELETED')
        ));
      if (existingHelpType) {
        throw new BadRequestException('Вид помощи с таким названием уже существует');
      }
    }

    // Строим объект обновления, исключая undefined значения
    const updateData: any = { updatedAt: new Date() };
    if (updateHelpTypeDto.name !== undefined) {
      updateData.name = updateHelpTypeDto.name;
    }

    const [helpType] = await this.db
      .update(helpTypes)
      .set(updateData)
      .where(and(
        eq(helpTypes.id, id),
        ne(helpTypes.recordStatus, 'DELETED')
      ))
      .returning();
    if (!helpType) {
      throw new NotFoundException(`Вид помощи с ID ${id} не найден`);
    }
    return helpType;
  }

  async remove(id: number) {
    const [helpType] = await this.db
      .update(helpTypes)
      .set({ recordStatus: 'DELETED', updatedAt: new Date() })
      .where(and(
        eq(helpTypes.id, id),
        ne(helpTypes.recordStatus, 'DELETED')
      ))
      .returning();
    if (!helpType) {
      throw new NotFoundException(`Вид помощи с ID ${id} не найден`);
    }
    return helpType;
  }
}

