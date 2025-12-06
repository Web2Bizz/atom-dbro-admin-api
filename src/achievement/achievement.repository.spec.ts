import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementRepository } from './achievement.repository';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

describe('AchievementRepository', () => {
  let repository: AchievementRepository;
  let mockDb: NodePgDatabase;

  const mockAchievement = {
    id: 1,
    title: 'Первое достижение',
    description: 'Описание достижения',
    icon: 'icon.png',
    rarity: 'common',
    questId: null,
    recordStatus: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQuest = {
    id: 1,
    title: 'Тестовый квест',
    recordStatus: 'CREATED',
  };

  const mockUser = {
    id: 1,
    firstName: 'Иван',
    lastName: 'Иванов',
    email: 'ivan@example.com',
    recordStatus: 'CREATED',
  };

  const mockUserAchievement = {
    id: 1,
    userId: 1,
    achievementId: 1,
    unlockedAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
    } as unknown as NodePgDatabase;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<AchievementRepository>(AchievementRepository);
  });

  describe('findByTitle', () => {
    it('should return achievement when found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAchievement]),
        }),
      });

      const result = await repository.findByTitle('Первое достижение');

      expect(result).toEqual(mockAchievement);
    });

    it('should return undefined when not found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findByTitle('Несуществующее');

      expect(result).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return achievement when found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAchievement]),
        }),
      });

      const result = await repository.findById(1);

      expect(result).toEqual(mockAchievement);
    });

    it('should return undefined when not found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return array of achievements', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAchievement]),
        }),
      });

      const result = await repository.findAll();

      expect(result).toEqual([mockAchievement]);
    });

    it('should return empty array when no achievements', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create and return achievement', async () => {
      const createData = {
        title: 'Новое достижение',
        description: 'Описание',
        rarity: 'common',
      };

      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockAchievement]),
        }),
      });

      const result = await repository.create(createData);

      expect(result).toEqual(mockAchievement);
    });
  });

  describe('update', () => {
    it('should update and return achievement', async () => {
      const updateData = {
        title: 'Обновленное название',
      };
      const updatedAchievement = { ...mockAchievement, ...updateData };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedAchievement]),
          }),
        }),
      });

      const result = await repository.update(1, updateData);

      expect(result).toEqual(updatedAchievement);
    });

    it('should return undefined when achievement not found', async () => {
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.update(999, { title: 'Новое' });

      expect(result).toBeUndefined();
    });
  });

  describe('softDelete', () => {
    it('should soft delete and return achievement', async () => {
      const deletedAchievement = { ...mockAchievement, recordStatus: 'DELETED' };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([deletedAchievement]),
          }),
        }),
      });

      const result = await repository.softDelete(1);

      expect(result).toEqual(deletedAchievement);
    });
  });

  describe('findQuestById', () => {
    it('should return quest when found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockQuest]),
        }),
      });

      const result = await repository.findQuestById(1);

      expect(result).toEqual(mockQuest);
    });

    it('should return undefined when not found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findQuestById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await repository.findUserById(1);

      expect(result).toEqual(mockUser);
    });

    it('should return undefined when not found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findUserById(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findUserAchievement', () => {
    it('should return user achievement when found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockUserAchievement]),
        }),
      });

      const result = await repository.findUserAchievement(1, 1);

      expect(result).toEqual(mockUserAchievement);
    });

    it('should return undefined when not found', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findUserAchievement(1, 999);

      expect(result).toBeUndefined();
    });
  });

  describe('assignToUser', () => {
    it('should assign achievement to user and return result', async () => {
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockUserAchievement]),
        }),
      });

      const result = await repository.assignToUser(1, 1);

      expect(result).toEqual(mockUserAchievement);
    });
  });

  describe('findUserAchievements', () => {
    it('should return user achievements with details', async () => {
      const userAchievementsWithDetails = [
        {
          id: 1,
          userId: 1,
          achievementId: 1,
          unlockedAt: new Date(),
          achievement: {
            id: 1,
            title: 'Первое достижение',
            description: 'Описание',
            icon: 'icon.png',
            rarity: 'common',
            questId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(userAchievementsWithDetails),
          }),
        }),
      });

      const result = await repository.findUserAchievements(1);

      expect(result).toEqual(userAchievementsWithDetails);
    });

    it('should return empty array when user has no achievements', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findUserAchievements(1);

      expect(result).toEqual([]);
    });
  });
});

