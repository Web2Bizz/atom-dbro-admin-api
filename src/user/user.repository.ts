import { Injectable, Inject, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../database/schema';
import { eq, ne, and } from 'drizzle-orm';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  /**
   * Найти пользователя по email (включая passwordHash)
   * @param email Email пользователя
   * @returns Пользователь или undefined
   */
  async findByEmail(email: string): Promise<typeof users.$inferSelect | undefined> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(
          eq(users.email, email),
          ne(users.recordStatus, 'DELETED')
        ));
      
      return user;
    } catch (error: any) {
      this.logger.error(`Ошибка в findByEmail для email ${email}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findByEmail',
        email,
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
   * Найти пользователя по ID (без passwordHash)
   * @param id ID пользователя
   * @returns Пользователь или undefined
   */
  async findById(id: number): Promise<Omit<typeof users.$inferSelect, 'passwordHash'> | undefined> {
    try {
      const [user] = await this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          middleName: users.middleName,
          email: users.email,
          avatarUrls: users.avatarUrls,
          role: users.role,
          level: users.level,
          experience: users.experience,
          organisationId: users.organisationId,
          recordStatus: users.recordStatus,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(and(
          eq(users.id, id),
          ne(users.recordStatus, 'DELETED')
        ));
      
      return user;
    } catch (error: any) {
      this.logger.error(`Ошибка в findById для пользователя ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findById',
        userId: id,
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
   * Найти пользователя по ID с passwordHash (для внутренних операций)
   * @param id ID пользователя
   * @returns Пользователь с passwordHash или undefined
   */
  async findByIdWithPassword(id: number): Promise<typeof users.$inferSelect | undefined> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(
          eq(users.id, id),
          ne(users.recordStatus, 'DELETED')
        ));
      
      return user;
    } catch (error: any) {
      this.logger.error(`Ошибка в findByIdWithPassword для пользователя ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'findByIdWithPassword',
        userId: id,
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
   * Найти всех пользователей (без passwordHash)
   * @returns Массив пользователей
   */
  async findAll(): Promise<Array<Omit<typeof users.$inferSelect, 'passwordHash'>>> {
    try {
      return await this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          middleName: users.middleName,
          email: users.email,
          avatarUrls: users.avatarUrls,
          role: users.role,
          level: users.level,
          experience: users.experience,
          organisationId: users.organisationId,
          recordStatus: users.recordStatus,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(ne(users.recordStatus, 'DELETED'));
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
   * Проверить существование пользователя по email
   * @param email Email пользователя
   * @returns true если пользователь существует
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const [user] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.email, email),
          ne(users.recordStatus, 'DELETED')
        ));
      
      return !!user;
    } catch (error: any) {
      this.logger.error(`Ошибка в existsByEmail для email ${email}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'existsByEmail',
        email,
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
   * Создать пользователя
   * @param data Данные пользователя
   * @returns Созданный пользователь
   * @throws ConflictException если пользователь с таким email уже существует
   */
  async create(data: {
    firstName: string;
    lastName: string;
    middleName?: string | null;
    email: string;
    passwordHash: string;
    avatarUrls: Record<number, string>;
    role?: string;
    level?: number;
    experience?: number;
    organisationId?: number | null;
  }): Promise<typeof users.$inferSelect> {
    try {
      // Проверяем уникальность email
      const exists = await this.existsByEmail(data.email);
      if (exists) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }

      const [user] = await this.db
        .insert(users)
        .values({
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName ?? null,
          email: data.email,
          passwordHash: data.passwordHash,
          avatarUrls: data.avatarUrls,
          role: data.role ?? 'USER',
          level: data.level ?? 1,
          experience: data.experience ?? 0,
          organisationId: data.organisationId ?? null,
        })
        .returning();
      
      if (!user) {
        throw new Error('Не удалось создать пользователя');
      }

      return user;
    } catch (error: any) {
      // Если это уже ConflictException, пробрасываем как есть
      if (error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error('Ошибка в create:', error);
      this.logger.error('Детали ошибки:', {
        method: 'create',
        email: data.email,
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
   * Обновить пользователя
   * @param id ID пользователя
   * @param data Данные для обновления
   * @returns Обновленный пользователь
   * @throws NotFoundException если пользователь не найден
   * @throws ConflictException если email уже используется другим пользователем
   */
  async update(
    id: number,
    data: Partial<{
      firstName: string;
      lastName: string;
      middleName: string | null;
      email: string;
      avatarUrls: Record<number, string>;
      role: string;
      organisationId: number | null;
    }>,
  ): Promise<typeof users.$inferSelect> {
    try {
      // Проверяем существование пользователя
      const existingUser = await this.findByIdWithPassword(id);
      if (!existingUser) {
        throw new NotFoundException(`Пользователь с ID ${id} не найден`);
      }

      // Если обновляется email, проверяем уникальность
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.existsByEmail(data.email);
        if (emailExists) {
          throw new ConflictException('Пользователь с таким email уже существует');
        }
      }

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      const [user] = await this.db
        .update(users)
        .set(updateData)
        .where(and(
          eq(users.id, id),
          ne(users.recordStatus, 'DELETED')
        ))
        .returning();
      
      if (!user) {
        throw new NotFoundException(`Пользователь с ID ${id} не найден`);
      }

      return user;
    } catch (error: any) {
      // Если это уже NestJS исключение, пробрасываем как есть
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      this.logger.error(`Ошибка в update для пользователя ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'update',
        userId: id,
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
   * Обновить пароль пользователя
   * @param id ID пользователя
   * @param passwordHash Новый хеш пароля
   * @returns Обновленный пользователь
   * @throws NotFoundException если пользователь не найден
   */
  async updatePassword(id: number, passwordHash: string): Promise<typeof users.$inferSelect> {
    try {
      const [user] = await this.db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(and(
          eq(users.id, id),
          ne(users.recordStatus, 'DELETED')
        ))
        .returning();
      
      if (!user) {
        throw new NotFoundException(`Пользователь с ID ${id} не найден`);
      }

      return user;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Ошибка в updatePassword для пользователя ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'updatePassword',
        userId: id,
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
   * Обновить опыт и уровень пользователя
   * @param id ID пользователя
   * @param experience Новое значение опыта
   * @param level Новый уровень
   * @returns Обновленный пользователь
   * @throws NotFoundException если пользователь не найден
   */
  async updateExperienceAndLevel(
    id: number,
    experience: number,
    level: number,
  ): Promise<typeof users.$inferSelect> {
    try {
      const [user] = await this.db
        .update(users)
        .set({
          experience,
          level,
          updatedAt: new Date(),
        })
        .where(and(
          eq(users.id, id),
          ne(users.recordStatus, 'DELETED')
        ))
        .returning();
      
      if (!user) {
        throw new NotFoundException(`Пользователь с ID ${id} не найден`);
      }

      return user;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Ошибка в updateExperienceAndLevel для пользователя ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'updateExperienceAndLevel',
        userId: id,
        experience,
        level,
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
   * Удалить пользователя (мягкое удаление)
   * @param id ID пользователя
   * @returns Обновленный пользователь
   * @throws NotFoundException если пользователь не найден
   */
  async remove(id: number): Promise<typeof users.$inferSelect> {
    try {
      const [user] = await this.db
        .update(users)
        .set({
          recordStatus: 'DELETED',
          updatedAt: new Date(),
        })
        .where(and(
          eq(users.id, id),
          ne(users.recordStatus, 'DELETED')
        ))
        .returning();
      
      if (!user) {
        throw new NotFoundException(`Пользователь с ID ${id} не найден`);
      }

      return user;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Ошибка в remove для пользователя ID ${id}:`, error);
      this.logger.error('Детали ошибки:', {
        method: 'remove',
        userId: id,
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

