import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  quests,
  userQuests,
  users,
  achievements,
  userAchievements,
  cities,
  organizationTypes,
  categories,
  questCategories,
} from '../database/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';

export interface QuestWithRelations {
  id: number;
  title: string;
  description: string | null;
  status: string;
  experienceReward: number;
  achievementId: number | null;
  ownerId: number;
  cityId: number;
  organizationTypeId: number | null;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  contacts: Array<{ name: string; value: string }> | null;
  coverImage: string | null;
  gallery: string[] | null;
  steps: Array<{
    title: string;
    description?: string;
    status: string;
    progress: number;
    requirement?: {
      currentValue: number;
      targetValue: number;
    };
    deadline?: Date | string;
  }> | null;
  recordStatus: string;
  createdAt: Date;
  updatedAt: Date;
  achievement: {
    id: number | null;
    title: string | null;
    description: string | null;
    icon: string | null;
    rarity: string | null;
    questId: number | null;
  } | null;
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  city: {
    id: number | null;
    name: string | null;
  } | null;
  organizationType: {
    id: number | null;
    name: string | null;
  } | null;
}

export interface CategoryRelation {
  questId: number;
  id: number;
  name: string;
}

@Injectable()
export class QuestRepository {
  private readonly logger = new Logger(QuestRepository.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  /**
   * Найти квест по ID с полными данными
   */
  async findById(id: number): Promise<QuestWithRelations | undefined> {
    try {
      const [quest] = await this.db
        .select({
          id: quests.id,
          title: quests.title,
          description: quests.description,
          status: quests.status,
          experienceReward: quests.experienceReward,
          achievementId: quests.achievementId,
          ownerId: quests.ownerId,
          cityId: quests.cityId,
          organizationTypeId: quests.organizationTypeId,
          latitude: quests.latitude,
          longitude: quests.longitude,
          address: quests.address,
          contacts: quests.contacts,
          coverImage: quests.coverImage,
          gallery: quests.gallery,
          steps: quests.steps,
          recordStatus: quests.recordStatus,
          createdAt: quests.createdAt,
          updatedAt: quests.updatedAt,
          achievement: {
            id: achievements.id,
            title: achievements.title,
            description: achievements.description,
            icon: achievements.icon,
            rarity: achievements.rarity,
            questId: achievements.questId,
          },
          owner: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          city: {
            id: cities.id,
            name: cities.name,
          },
          organizationType: {
            id: organizationTypes.id,
            name: organizationTypes.name,
          },
        })
        .from(quests)
        .leftJoin(achievements, and(
          eq(quests.achievementId, achievements.id),
          ne(achievements.recordStatus, 'DELETED')
        ))
        .innerJoin(users, and(
          eq(quests.ownerId, users.id),
          ne(users.recordStatus, 'DELETED')
        ))
        .leftJoin(cities, and(
          eq(quests.cityId, cities.id),
          ne(cities.recordStatus, 'DELETED')
        ))
        .leftJoin(organizationTypes, and(
          eq(quests.organizationTypeId, organizationTypes.id),
          ne(organizationTypes.recordStatus, 'DELETED')
        ))
        .where(and(
          eq(quests.id, id),
          ne(quests.recordStatus, 'DELETED')
        ));

      return quest as QuestWithRelations | undefined;
    } catch (error: any) {
      this.logger.error(`Ошибка в findById для квеста ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findById',
        questId: id,
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

  /**
   * Найти квест по ID (базовая версия без связей)
   */
  async findByIdBasic(id: number): Promise<typeof quests.$inferSelect | undefined> {
    try {
      const [quest] = await this.db
        .select()
        .from(quests)
        .where(and(
          eq(quests.id, id),
          ne(quests.recordStatus, 'DELETED')
        ));

      return quest;
    } catch (error: any) {
      this.logger.error(`Ошибка в findByIdBasic для квеста ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Найти все квесты с фильтрами
   */
  async findAll(cityId?: number, categoryId?: number): Promise<QuestWithRelations[]> {
    try {
      let query = this.db
        .select({
          id: quests.id,
          title: quests.title,
          description: quests.description,
          status: quests.status,
          experienceReward: quests.experienceReward,
          achievementId: quests.achievementId,
          ownerId: quests.ownerId,
          cityId: quests.cityId,
          organizationTypeId: quests.organizationTypeId,
          latitude: quests.latitude,
          longitude: quests.longitude,
          address: quests.address,
          contacts: quests.contacts,
          coverImage: quests.coverImage,
          gallery: quests.gallery,
          steps: quests.steps,
          recordStatus: quests.recordStatus,
          createdAt: quests.createdAt,
          updatedAt: quests.updatedAt,
          achievement: {
            id: achievements.id,
            title: achievements.title,
            description: achievements.description,
            icon: achievements.icon,
            rarity: achievements.rarity,
            questId: achievements.questId,
          },
          owner: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          city: {
            id: cities.id,
            name: cities.name,
          },
          organizationType: {
            id: organizationTypes.id,
            name: organizationTypes.name,
          },
        })
        .from(quests)
        .leftJoin(achievements, and(
          eq(quests.achievementId, achievements.id),
          ne(achievements.recordStatus, 'DELETED')
        ))
        .innerJoin(users, and(
          eq(quests.ownerId, users.id),
          ne(users.recordStatus, 'DELETED')
        ))
        .leftJoin(cities, and(
          eq(quests.cityId, cities.id),
          ne(cities.recordStatus, 'DELETED')
        ))
        .leftJoin(organizationTypes, and(
          eq(quests.organizationTypeId, organizationTypes.id),
          ne(organizationTypes.recordStatus, 'DELETED')
        ));

      const conditions = [];
      if (cityId) {
        conditions.push(eq(quests.cityId, cityId));
      }
      if (categoryId) {
        query = query.innerJoin(questCategories, eq(quests.id, questCategories.questId)) as any;
        conditions.push(eq(questCategories.categoryId, categoryId));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return await query as QuestWithRelations[];
    } catch (error: any) {
      this.logger.error('Ошибка в findAll:', error);
      this.logger.error('Детали ошибки:', {
        method: 'findAll',
        cityId,
        categoryId,
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

  /**
   * Найти квесты по статусу
   */
  async findByStatus(
    status?: 'active' | 'archived' | 'completed',
    cityId?: number,
    categoryId?: number,
  ): Promise<QuestWithRelations[]> {
    try {
      let baseQuery = this.db
        .select({
          id: quests.id,
          title: quests.title,
          description: quests.description,
          status: quests.status,
          experienceReward: quests.experienceReward,
          achievementId: quests.achievementId,
          ownerId: quests.ownerId,
          createdAt: quests.createdAt,
          updatedAt: quests.updatedAt,
          achievement: {
            id: achievements.id,
            title: achievements.title,
            description: achievements.description,
            icon: achievements.icon,
            rarity: achievements.rarity,
            questId: achievements.questId,
          },
          owner: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(quests)
        .leftJoin(achievements, and(
          eq(quests.achievementId, achievements.id),
          ne(achievements.recordStatus, 'DELETED')
        ))
        .innerJoin(users, and(
          eq(quests.ownerId, users.id),
          ne(users.recordStatus, 'DELETED')
        ))
        .leftJoin(cities, and(
          eq(quests.cityId, cities.id),
          ne(cities.recordStatus, 'DELETED')
        ));

      const conditions = [ne(quests.recordStatus, 'DELETED')];
      if (status) {
        conditions.push(eq(quests.status, status));
      }
      if (cityId) {
        conditions.push(eq(quests.cityId, cityId));
      }
      if (categoryId) {
        baseQuery = baseQuery.innerJoin(questCategories, eq(quests.id, questCategories.questId)) as any;
        conditions.push(eq(questCategories.categoryId, categoryId));
      }
      if (conditions.length > 0) {
        baseQuery = baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
      }

      return await baseQuery as QuestWithRelations[];
    } catch (error: any) {
      this.logger.error('Ошибка в findByStatus:', error);
      throw error;
    }
  }

  /**
   * Найти активные квесты
   */
  async findActiveQuests(): Promise<QuestWithRelations[]> {
    try {
      return await this.db
        .select({
          id: quests.id,
          title: quests.title,
          description: quests.description,
          status: quests.status,
          experienceReward: quests.experienceReward,
          achievementId: quests.achievementId,
          ownerId: quests.ownerId,
          cityId: quests.cityId,
          coverImage: quests.coverImage,
          gallery: quests.gallery,
          steps: quests.steps,
          createdAt: quests.createdAt,
          updatedAt: quests.updatedAt,
          achievement: {
            id: achievements.id,
            title: achievements.title,
            description: achievements.description,
            icon: achievements.icon,
            rarity: achievements.rarity,
            questId: achievements.questId,
          },
          owner: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
          city: {
            id: cities.id,
            name: cities.name,
          },
        })
        .from(quests)
        .leftJoin(achievements, and(
          eq(quests.achievementId, achievements.id),
          ne(achievements.recordStatus, 'DELETED')
        ))
        .innerJoin(users, and(
          eq(quests.ownerId, users.id),
          ne(users.recordStatus, 'DELETED')
        ))
        .leftJoin(cities, and(
          eq(quests.cityId, cities.id),
          ne(cities.recordStatus, 'DELETED')
        ))
        .where(and(
          eq(quests.status, 'active'),
          ne(quests.recordStatus, 'DELETED')
        )) as QuestWithRelations[];
    } catch (error: any) {
      this.logger.error('Ошибка в findActiveQuests:', error);
      throw error;
    }
  }

  /**
   * Создать квест
   */
  async create(data: {
    title: string;
    description?: string | null;
    status?: string;
    experienceReward?: number;
    achievementId?: number | null;
    ownerId: number;
    cityId: number;
    organizationTypeId?: number | null;
    latitude?: string | null;
    longitude?: string | null;
    address?: string | null;
    contacts?: Array<{ name: string; value: string }> | null;
    coverImage?: string | null;
    gallery?: string[] | null;
    steps?: Array<{
      title: string;
      description?: string;
      status: string;
      progress: number;
      requirement?: {
        currentValue: number;
        targetValue: number;
      };
      deadline?: Date | string;
    }> | null;
  }): Promise<typeof quests.$inferSelect> {
    try {
      const result = await this.db
        .insert(quests)
        .values(data)
        .returning();

      const quest = Array.isArray(result) ? result[0] : result;
      if (!quest) {
        throw new Error('Не удалось создать квест');
      }

      return quest;
    } catch (error: any) {
      this.logger.error('Ошибка в create при создании квеста:', error);
      this.logger.error('Детали ошибки:', {
        method: 'create',
        title: data.title,
        ownerId: data.ownerId,
        cityId: data.cityId,
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

  /**
   * Обновить квест
   */
  async update(
    id: number,
    data: Partial<typeof quests.$inferInsert>,
  ): Promise<typeof quests.$inferSelect | undefined> {
    try {
      const result = await this.db
        .update(quests)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(quests.id, id),
          ne(quests.recordStatus, 'DELETED')
        ))
        .returning();

      const quest = Array.isArray(result) ? result[0] : result;
      return quest;
    } catch (error: any) {
      this.logger.error(`Ошибка в update для квеста ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'update',
        questId: id,
        updateFields: Object.keys(data),
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

  /**
   * Обновить статус квеста
   */
  async updateStatus(id: number, status: 'active' | 'archived' | 'completed'): Promise<typeof quests.$inferSelect | undefined> {
    return this.update(id, { status });
  }

  /**
   * Мягкое удаление квеста
   */
  async softDelete(id: number): Promise<typeof quests.$inferSelect | undefined> {
    try {
      const result = await this.db
        .update(quests)
        .set({ recordStatus: 'DELETED', updatedAt: new Date() })
        .where(and(
          eq(quests.id, id),
          ne(quests.recordStatus, 'DELETED')
        ))
        .returning();

      const quest = Array.isArray(result) ? result[0] : result;
      return quest;
    } catch (error: any) {
      this.logger.error(`Ошибка в softDelete для квеста ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Получить категории для квестов
   */
  async findCategoriesByQuestIds(questIds: number[]): Promise<CategoryRelation[]> {
    if (questIds.length === 0) return [];

    try {
      return await this.db
        .select({
          questId: questCategories.questId,
          id: categories.id,
          name: categories.name,
        })
        .from(questCategories)
        .innerJoin(categories, eq(questCategories.categoryId, categories.id))
        .where(and(
          inArray(questCategories.questId, questIds),
          ne(categories.recordStatus, 'DELETED')
        ));
    } catch (error: any) {
      this.logger.error('Ошибка в findCategoriesByQuestIds:', error);
      throw error;
    }
  }

  /**
   * Получить категории для одного квеста
   */
  async findCategoriesByQuestId(questId: number): Promise<Array<{ id: number; name: string }>> {
    try {
      return await this.db
        .select({
          id: categories.id,
          name: categories.name,
        })
        .from(questCategories)
        .innerJoin(categories, eq(questCategories.categoryId, categories.id))
        .where(and(
          eq(questCategories.questId, questId),
          ne(categories.recordStatus, 'DELETED')
        ));
    } catch (error: any) {
      this.logger.error(`Ошибка в findCategoriesByQuestId для квеста ID ${questId}:`, error);
      throw error;
    }
  }

  /**
   * Создать связи квест-категория
   */
  async createQuestCategories(questId: number, categoryIds: number[]): Promise<void> {
    if (categoryIds.length === 0) return;

    try {
      await this.db
        .insert(questCategories)
        .values(
          categoryIds.map(categoryId => ({
            questId,
            categoryId,
          }))
        );
    } catch (error: any) {
      this.logger.error(`Ошибка в createQuestCategories для квеста ID ${questId}:`, error);
      throw error;
    }
  }

  /**
   * Удалить все связи квест-категория для квеста
   */
  async deleteQuestCategories(questId: number): Promise<void> {
    try {
      await this.db
        .delete(questCategories)
        .where(eq(questCategories.questId, questId));
    } catch (error: any) {
      this.logger.error(`Ошибка в deleteQuestCategories для квеста ID ${questId}:`, error);
      throw error;
    }
  }

  /**
   * Найти связь пользователь-квест
   */
  async findUserQuest(userId: number, questId: number): Promise<typeof userQuests.$inferSelect | undefined> {
    try {
      const [userQuest] = await this.db
        .select()
        .from(userQuests)
        .where(and(
          eq(userQuests.userId, userId),
          eq(userQuests.questId, questId),
        ));

      return userQuest;
    } catch (error: any) {
      this.logger.error(`Ошибка в findUserQuest для пользователя ID ${userId} и квеста ID ${questId}:`, error);
      throw error;
    }
  }

  /**
   * Создать связь пользователь-квест
   */
  async createUserQuest(userId: number, questId: number, status: 'in_progress' | 'completed' | 'failed' = 'in_progress'): Promise<typeof userQuests.$inferSelect> {
    try {
      const result = await this.db
        .insert(userQuests)
        .values({
          userId,
          questId,
          status,
        })
        .returning();

      const userQuest = Array.isArray(result) ? result[0] : result;
      if (!userQuest) {
        throw new Error('Не удалось создать связь пользователь-квест');
      }

      return userQuest;
    } catch (error: any) {
      this.logger.error(`Ошибка в createUserQuest для пользователя ID ${userId} и квеста ID ${questId}:`, error);
      throw error;
    }
  }

  /**
   * Обновить связь пользователь-квест
   */
  async updateUserQuest(
    userQuestId: number,
    data: Partial<typeof userQuests.$inferInsert>,
  ): Promise<typeof userQuests.$inferSelect | undefined> {
    try {
      const result = await this.db
        .update(userQuests)
        .set(data)
        .where(eq(userQuests.id, userQuestId))
        .returning();

      const userQuest = Array.isArray(result) ? result[0] : result;
      return userQuest;
    } catch (error: any) {
      this.logger.error(`Ошибка в updateUserQuest для связи ID ${userQuestId}:`, error);
      throw error;
    }
  }

  /**
   * Удалить связь пользователь-квест
   */
  async deleteUserQuest(userQuestId: number): Promise<typeof userQuests.$inferSelect | undefined> {
    try {
      const result = await this.db
        .delete(userQuests)
        .where(eq(userQuests.id, userQuestId))
        .returning();

      const userQuest = Array.isArray(result) ? result[0] : result;
      return userQuest;
    } catch (error: any) {
      this.logger.error(`Ошибка в deleteUserQuest для связи ID ${userQuestId}:`, error);
      throw error;
    }
  }

  /**
   * Получить все квесты пользователя
   */
  async findUserQuestsByUserId(userId: number): Promise<Array<{
    id: number;
    userId: number;
    questId: number;
    status: string;
    startedAt: Date | null;
    completedAt: Date | null;
    quest: {
      id: number;
      title: string;
      description: string | null;
      status: string;
      experienceReward: number;
      achievementId: number | null;
      ownerId: number;
      cityId: number;
      coverImage: string | null;
      gallery: string[] | null;
      steps: Array<{
        title: string;
        description?: string;
        status: string;
        progress: number;
        requirement?: {
          currentValue: number;
          targetValue: number;
        };
        deadline?: Date | string;
      }> | null;
      createdAt: Date;
      updatedAt: Date;
    };
    achievement: {
      id: number | null;
      title: string | null;
      description: string | null;
      icon: string | null;
      rarity: string | null;
      questId: number | null;
    } | null;
    city: {
      id: number;
      name: string;
    } | null;
  }>> {
    try {
      return await this.db
        .select({
          id: userQuests.id,
          userId: userQuests.userId,
          questId: userQuests.questId,
          status: userQuests.status,
          startedAt: userQuests.startedAt,
          completedAt: userQuests.completedAt,
          quest: {
            id: quests.id,
            title: quests.title,
            description: quests.description,
            status: quests.status,
            experienceReward: quests.experienceReward,
            achievementId: quests.achievementId,
            ownerId: quests.ownerId,
            cityId: quests.cityId,
            coverImage: quests.coverImage,
            gallery: quests.gallery,
            steps: quests.steps,
            createdAt: quests.createdAt,
            updatedAt: quests.updatedAt,
          },
          achievement: {
            id: achievements.id,
            title: achievements.title,
            description: achievements.description,
            icon: achievements.icon,
            rarity: achievements.rarity,
            questId: achievements.questId,
          },
          city: {
            id: cities.id,
            name: cities.name,
          },
        })
        .from(userQuests)
        .innerJoin(quests, and(
          eq(userQuests.questId, quests.id),
          ne(quests.recordStatus, 'DELETED')
        ))
        .leftJoin(achievements, and(
          eq(quests.achievementId, achievements.id),
          ne(achievements.recordStatus, 'DELETED')
        ))
        .leftJoin(cities, and(
          eq(quests.cityId, cities.id),
          ne(cities.recordStatus, 'DELETED')
        ))
        .where(eq(userQuests.userId, userId));
    } catch (error: any) {
      this.logger.error(`Ошибка в findUserQuestsByUserId для пользователя ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Получить ID квестов, которые начал пользователь
   */
  async findStartedQuestIdsByUserId(userId: number): Promise<number[]> {
    try {
      const userStartedQuests = await this.db
        .select({ questId: userQuests.questId })
        .from(userQuests)
        .where(eq(userQuests.userId, userId));

      return userStartedQuests.map(uq => uq.questId);
    } catch (error: any) {
      this.logger.error(`Ошибка в findStartedQuestIdsByUserId для пользователя ID ${userId}:`, error);
      throw error;
    }
  }
}

