import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { questUpdates, quests } from '../database/schema';
import { eq, ne, and } from 'drizzle-orm';
import { CreateQuestUpdateDto } from './dto/create-quest-update.dto';
import { UpdateQuestUpdateDto } from './dto/update-quest-update.dto';

@Injectable()
export class QuestUpdateService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  async create(createQuestUpdateDto: CreateQuestUpdateDto) {
    // Проверяем существование квеста (исключая удаленные)
    const [quest] = await this.db
      .select()
      .from(quests)
      .where(and(
        eq(quests.id, createQuestUpdateDto.questId),
        ne(quests.recordStatus, 'DELETED')
      ));
    if (!quest) {
      throw new NotFoundException(`Квест с ID ${createQuestUpdateDto.questId} не найден`);
    }

    // Валидация фотографий (максимум 5 элементов)
    if (createQuestUpdateDto.photos && createQuestUpdateDto.photos.length > 5) {
      throw new BadRequestException('Максимум 5 фотографий');
    }

    const [questUpdate] = await this.db
      .insert(questUpdates)
      .values({
        questId: createQuestUpdateDto.questId,
        title: createQuestUpdateDto.title,
        text: createQuestUpdateDto.text,
        photos: createQuestUpdateDto.photos || [],
      })
      .returning();
    return questUpdate;
  }

  async findAll(questId?: number) {
    const conditions = [];
    if (questId) {
      conditions.push(eq(questUpdates.questId, questId));
    }
    return this.db
      .select()
      .from(questUpdates)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async findOne(id: number) {
    const [questUpdate] = await this.db
      .select()
      .from(questUpdates)
      .where(and(
        eq(questUpdates.id, id),
        ne(questUpdates.recordStatus, 'DELETED')
      ));
    if (!questUpdate) {
      throw new NotFoundException(`Обновление квеста с ID ${id} не найдено`);
    }
    return questUpdate;
  }

  async update(id: number, updateQuestUpdateDto: UpdateQuestUpdateDto) {
    // Если обновляется questId, проверяем существование квеста (исключая удаленные)
    if (updateQuestUpdateDto.questId !== undefined) {
      const [quest] = await this.db
        .select()
        .from(quests)
        .where(and(
          eq(quests.id, updateQuestUpdateDto.questId),
          ne(quests.recordStatus, 'DELETED')
        ));
      if (!quest) {
        throw new NotFoundException(`Квест с ID ${updateQuestUpdateDto.questId} не найден`);
      }
    }

    // Валидация фотографий (максимум 5 элементов)
    if (updateQuestUpdateDto.photos && updateQuestUpdateDto.photos.length > 5) {
      throw new BadRequestException('Максимум 5 фотографий');
    }

    const [questUpdate] = await this.db
      .update(questUpdates)
      .set({ ...updateQuestUpdateDto, updatedAt: new Date() })
      .where(and(
        eq(questUpdates.id, id),
        ne(questUpdates.recordStatus, 'DELETED')
      ))
      .returning();
    if (!questUpdate) {
      throw new NotFoundException(`Обновление квеста с ID ${id} не найдено`);
    }
    return questUpdate;
  }

  async remove(id: number) {
    const [questUpdate] = await this.db
      .update(questUpdates)
      .set({ recordStatus: 'DELETED', updatedAt: new Date() })
      .where(and(
        eq(questUpdates.id, id),
        ne(questUpdates.recordStatus, 'DELETED')
      ))
      .returning();
    if (!questUpdate) {
      throw new NotFoundException(`Обновление квеста с ID ${id} не найдено`);
    }
    return questUpdate;
  }
}

