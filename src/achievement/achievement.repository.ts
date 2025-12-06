import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { achievements, userAchievements, users, quests } from '../database/schema';
import { eq, and, ne } from 'drizzle-orm';

export interface UserAchievementWithDetails {
  id: number;
  userId: number;
  achievementId: number;
  unlockedAt: Date;
  achievement: {
    id: number;
    title: string;
    description: string | null;
    icon: string | null;
    rarity: string;
    questId: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class AchievementRepository {
  private readonly logger = new Logger(AchievementRepository.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  /**
   * Найти достижение по названию (исключая удаленные)
   * @param title Название достижения
   * @returns Достижение или undefined
   */
  async findByTitle(title: string): Promise<typeof achievements.$inferSelect | undefined> {
    try {
      const [achievement] = await this.db
        .select()
        .from(achievements)
        .where(and(
          eq(achievements.title, title),
          ne(achievements.recordStatus, 'DELETED')
        ));
      
      return achievement;
    } catch (error: any) {
      this.logger.error(`Ошибка в findByTitle для названия "${title}":`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findByTitle',
        title,
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
   * Найти достижение по названию, исключая конкретный ID (для проверки уникальности при обновлении)
   * @param title Название достижения
   * @param excludeId ID достижения, которое нужно исключить из поиска
   * @returns Достижение или undefined
   */
  async findByTitleExcludingId(title: string, excludeId: number): Promise<typeof achievements.$inferSelect | undefined> {
    try {
      const [achievement] = await this.db
        .select()
        .from(achievements)
        .where(and(
          eq(achievements.title, title),
          ne(achievements.id, excludeId),
          ne(achievements.recordStatus, 'DELETED')
        ));
      
      return achievement;
    } catch (error: any) {
      this.logger.error(`Ошибка в findByTitleExcludingId для названия "${title}" и ID ${excludeId}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findByTitleExcludingId',
        title,
        excludeId,
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
   * Найти достижение по ID (исключая удаленные)
   * @param id ID достижения
   * @returns Достижение или undefined
   */
  async findById(id: number): Promise<typeof achievements.$inferSelect | undefined> {
    try {
      const [achievement] = await this.db
        .select()
        .from(achievements)
        .where(and(
          eq(achievements.id, id),
          ne(achievements.recordStatus, 'DELETED')
        ));
      
      return achievement;
    } catch (error: any) {
      this.logger.error(`Ошибка в findById для достижения ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findById',
        achievementId: id,
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
   * Найти все достижения (исключая удаленные)
   * @returns Массив всех достижений
   */
  async findAll(): Promise<typeof achievements.$inferSelect[]> {
    try {
      return await this.db
        .select()
        .from(achievements)
        .where(ne(achievements.recordStatus, 'DELETED'));
    } catch (error: any) {
      this.logger.error('Ошибка в findAll:', error);
      this.logger.error('Детали ошибки:', {
        method: 'findAll',
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
   * Создать достижение
   * @param data Данные для создания достижения
   * @returns Созданное достижение
   */
  async create(data: {
    title: string;
    description?: string | null;
    icon?: string | null;
    rarity: string;
    questId?: number | null;
  }): Promise<typeof achievements.$inferSelect> {
    try {
      const result = await this.db
        .insert(achievements)
        .values(data)
        .returning();
      
      const achievement = Array.isArray(result) ? result[0] : result;
      if (!achievement) {
        throw new Error('Не удалось создать достижение');
      }

      return achievement;
    } catch (error: any) {
      this.logger.error('Ошибка в create:', error);
      this.logger.error('Детали ошибки:', {
        method: 'create',
        title: data.title,
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
   * Обновить достижение
   * @param id ID достижения
   * @param data Данные для обновления
   * @returns Обновленное достижение или undefined
   */
  async update(
    id: number,
    data: Partial<{
      title: string;
      description: string | null;
      icon: string | null;
      rarity: string;
      questId: number | null;
    }>
  ): Promise<typeof achievements.$inferSelect | undefined> {
    try {
      const [achievement] = await this.db
        .update(achievements)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(achievements.id, id),
          ne(achievements.recordStatus, 'DELETED')
        ))
        .returning();
      
      return achievement;
    } catch (error: any) {
      this.logger.error(`Ошибка в update для достижения ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'update',
        achievementId: id,
        updateData: data,
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
   * Мягкое удаление достижения
   * @param id ID достижения
   * @returns Удаленное достижение или undefined
   */
  async softDelete(id: number): Promise<typeof achievements.$inferSelect | undefined> {
    try {
      const [achievement] = await this.db
        .update(achievements)
        .set({ recordStatus: 'DELETED', updatedAt: new Date() })
        .where(and(
          eq(achievements.id, id),
          ne(achievements.recordStatus, 'DELETED')
        ))
        .returning();
      
      return achievement;
    } catch (error: any) {
      this.logger.error(`Ошибка в softDelete для достижения ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'softDelete',
        achievementId: id,
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
   * Найти квест по ID (исключая удаленные)
   * @param id ID квеста
   * @returns Квест или undefined
   */
  async findQuestById(id: number): Promise<typeof quests.$inferSelect | undefined> {
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
      this.logger.error(`Ошибка в findQuestById для квеста ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findQuestById',
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
   * Найти пользователя по ID (исключая удаленных)
   * @param userId ID пользователя
   * @returns Пользователь или undefined
   */
  async findUserById(userId: number): Promise<typeof users.$inferSelect | undefined> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(
          eq(users.id, userId),
          ne(users.recordStatus, 'DELETED')
        ));
      
      return user;
    } catch (error: any) {
      this.logger.error(`Ошибка в findUserById для пользователя ID ${userId}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findUserById',
        userId,
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
   * Проверить, есть ли у пользователя конкретное достижение
   * @param userId ID пользователя
   * @param achievementId ID достижения
   * @returns UserAchievement или undefined
   */
  async findUserAchievement(
    userId: number,
    achievementId: number
  ): Promise<typeof userAchievements.$inferSelect | undefined> {
    try {
      const [userAchievement] = await this.db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        ));
      
      return userAchievement;
    } catch (error: any) {
      this.logger.error(`Ошибка в findUserAchievement для пользователя ID ${userId} и достижения ID ${achievementId}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findUserAchievement',
        userId,
        achievementId,
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
   * Присвоить достижение пользователю
   * @param userId ID пользователя
   * @param achievementId ID достижения
   * @returns Созданная связь пользователь-достижение
   */
  async assignToUser(
    userId: number,
    achievementId: number
  ): Promise<typeof userAchievements.$inferSelect> {
    try {
      const result = await this.db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
        })
        .returning();
      
      const userAchievement = Array.isArray(result) ? result[0] : result;
      if (!userAchievement) {
        throw new Error('Не удалось присвоить достижение пользователю');
      }

      return userAchievement;
    } catch (error: any) {
      this.logger.error(`Ошибка в assignToUser для пользователя ID ${userId} и достижения ID ${achievementId}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'assignToUser',
        userId,
        achievementId,
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
   * Получить все достижения пользователя с подробной информацией
   * @param userId ID пользователя
   * @returns Массив достижений пользователя с деталями
   */
  async findUserAchievements(userId: number): Promise<UserAchievementWithDetails[]> {
    try {
      return await this.db
        .select({
          id: userAchievements.id,
          userId: userAchievements.userId,
          achievementId: userAchievements.achievementId,
          unlockedAt: userAchievements.unlockedAt,
          achievement: {
            id: achievements.id,
            title: achievements.title,
            description: achievements.description,
            icon: achievements.icon,
            rarity: achievements.rarity,
            questId: achievements.questId,
            createdAt: achievements.createdAt,
            updatedAt: achievements.updatedAt,
          },
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(and(
          eq(userAchievements.userId, userId),
          ne(achievements.recordStatus, 'DELETED')
        ));
    } catch (error: any) {
      this.logger.error(`Ошибка в findUserAchievements для пользователя ID ${userId}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findUserAchievements',
        userId,
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
}

