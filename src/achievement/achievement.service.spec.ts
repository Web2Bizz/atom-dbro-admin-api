import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementService } from './achievement.service';
import { AchievementRepository } from './achievement.repository';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';

describe('AchievementService', () => {
  let service: AchievementService;
  let repository: AchievementRepository;

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

  const mockPrivateAchievement = {
    id: 2,
    title: 'Приватное достижение',
    description: 'Описание',
    icon: 'icon.png',
    rarity: 'private',
    questId: 1,
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

  const mockUserAchievementWithDetails = {
    id: 1,
    userId: 1,
    achievementId: 1,
    unlockedAt: new Date(),
    achievement: {
      id: 1,
      title: 'Первое достижение',
      description: 'Описание достижения',
      icon: 'icon.png',
      rarity: 'common',
      questId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  let mockRepository: {
    findByTitle: ReturnType<typeof vi.fn>;
    findByTitleExcludingId: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    findQuestById: ReturnType<typeof vi.fn>;
    findUserById: ReturnType<typeof vi.fn>;
    findUserAchievement: ReturnType<typeof vi.fn>;
    assignToUser: ReturnType<typeof vi.fn>;
    findUserAchievements: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockRepository = {
      findByTitle: vi.fn(),
      findByTitleExcludingId: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      findQuestById: vi.fn(),
      findUserById: vi.fn(),
      findUserAchievement: vi.fn(),
      assignToUser: vi.fn(),
      findUserAchievements: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: AchievementRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
    repository = module.get<AchievementRepository>(AchievementRepository);
  });

  describe('create', () => {
    const createDto: CreateAchievementDto = {
      title: 'Новое достижение',
      description: 'Описание',
      icon: 'icon.png',
      rarity: 'common',
    };

    it('should successfully create achievement with unique title', async () => {
      mockRepository.findByTitle.mockResolvedValue(undefined);
      mockRepository.create.mockResolvedValue(mockAchievement);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAchievement);
      expect(mockRepository.findByTitle).toHaveBeenCalledWith(createDto.title);
      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException when title already exists', async () => {
      const existingAchievement = { ...mockAchievement, title: createDto.title };
      mockRepository.findByTitle.mockResolvedValue(existingAchievement);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Достижение с таким названием уже существует'
      );
      expect(mockRepository.findByTitle).toHaveBeenCalledWith(createDto.title);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should successfully create private achievement with questId', async () => {
      const privateDto: CreateAchievementDto = {
        ...createDto,
        rarity: 'private',
        questId: 1,
      };
      mockRepository.findByTitle.mockResolvedValue(undefined);
      mockRepository.findQuestById.mockResolvedValue(mockQuest);
      mockRepository.create.mockResolvedValue(mockPrivateAchievement);

      const result = await service.create(privateDto);

      expect(result).toEqual(mockPrivateAchievement);
      expect(mockRepository.findQuestById).toHaveBeenCalledWith(1);
      expect(mockRepository.create).toHaveBeenCalledWith(privateDto);
    });

    it('should throw BadRequestException when rarity is private but questId is missing', async () => {
      const privateDto: CreateAchievementDto = {
        ...createDto,
        rarity: 'private',
      };
      mockRepository.findByTitle.mockResolvedValue(undefined);

      await expect(service.create(privateDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(privateDto)).rejects.toThrow(
        'Для rarity="private" questId обязателен'
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when questId does not exist', async () => {
      const privateDto: CreateAchievementDto = {
        ...createDto,
        rarity: 'private',
        questId: 999,
      };
      mockRepository.findByTitle.mockResolvedValue(undefined);
      mockRepository.findQuestById.mockResolvedValue(undefined);

      await expect(service.create(privateDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(privateDto)).rejects.toThrow(
        'Квест с ID 999 не найден'
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when rarity is not private but questId is provided', async () => {
      const dtoWithQuestId: CreateAchievementDto = {
        ...createDto,
        rarity: 'common',
        questId: 1,
      };
      mockRepository.findByTitle.mockResolvedValue(undefined);

      await expect(service.create(dtoWithQuestId)).rejects.toThrow(BadRequestException);
      await expect(service.create(dtoWithQuestId)).rejects.toThrow(
        'Для rarity отличной от "private" questId должен быть null или отсутствовать'
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should successfully return all achievements', async () => {
      const achievements = [mockAchievement];
      mockRepository.findAll.mockResolvedValue(achievements);

      const result = await service.findAll();

      expect(result).toEqual(achievements);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no achievements exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should successfully return achievement by id', async () => {
      const achievementId = 1;
      mockRepository.findById.mockResolvedValue(mockAchievement);

      const result = await service.findOne(achievementId);

      expect(result).toEqual(mockAchievement);
      expect(mockRepository.findById).toHaveBeenCalledWith(achievementId);
    });

    it('should throw NotFoundException for non-existent id', async () => {
      const achievementId = 999;
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.findOne(achievementId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(achievementId)).rejects.toThrow(
        `Достижение с ID ${achievementId} не найдено`
      );
      expect(mockRepository.findById).toHaveBeenCalledWith(achievementId);
    });
  });

  describe('update', () => {
    const achievementId = 1;
    const updateDto: UpdateAchievementDto = {
      title: 'Обновленное название',
    };

    it('should successfully update achievement', async () => {
      const updatedAchievement = { ...mockAchievement, title: 'Обновленное название' };
      mockRepository.findById.mockResolvedValue(mockAchievement);
      mockRepository.findByTitleExcludingId.mockResolvedValue(undefined);
      mockRepository.update.mockResolvedValue(updatedAchievement);

      const result = await service.update(achievementId, updateDto);

      expect(result).toEqual(updatedAchievement);
      expect(mockRepository.findByTitleExcludingId).toHaveBeenCalledWith(
        updateDto.title,
        achievementId
      );
      expect(mockRepository.update).toHaveBeenCalledWith(achievementId, updateDto);
    });

    it('should throw ConflictException when updating to existing title', async () => {
      const existingAchievement = { ...mockAchievement, id: 2, title: updateDto.title };
      mockRepository.findById.mockResolvedValue(mockAchievement);
      mockRepository.findByTitleExcludingId.mockResolvedValue(existingAchievement);

      await expect(service.update(achievementId, updateDto)).rejects.toThrow(ConflictException);
      await expect(service.update(achievementId, updateDto)).rejects.toThrow(
        'Достижение с таким названием уже существует'
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should allow update without changing title', async () => {
      const updateDtoWithoutTitle: UpdateAchievementDto = {
        description: 'Новое описание',
      };
      const updatedAchievement = { ...mockAchievement, description: 'Новое описание' };
      mockRepository.findById.mockResolvedValue(mockAchievement);
      mockRepository.update.mockResolvedValue(updatedAchievement);

      const result = await service.update(achievementId, updateDtoWithoutTitle);

      expect(result).toEqual(updatedAchievement);
      expect(mockRepository.findByTitleExcludingId).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(achievementId, updateDtoWithoutTitle);
    });

    it('should throw NotFoundException for non-existent id', async () => {
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.update(achievementId, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(achievementId, updateDto)).rejects.toThrow(
        `Достижение с ID ${achievementId} не найдено`
      );
    });

    it('should successfully update rarity to private with questId', async () => {
      const updateDtoPrivate: UpdateAchievementDto = {
        rarity: 'private',
        questId: 1,
      };
      const updatedAchievement = { ...mockAchievement, rarity: 'private', questId: 1 };
      mockRepository.findById.mockResolvedValue(mockAchievement);
      mockRepository.findQuestById.mockResolvedValue(mockQuest);
      mockRepository.update.mockResolvedValue(updatedAchievement);

      const result = await service.update(achievementId, updateDtoPrivate);

      expect(result).toEqual(updatedAchievement);
      expect(mockRepository.findQuestById).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException when updating to private without questId', async () => {
      const updateDtoPrivate: UpdateAchievementDto = {
        rarity: 'private',
      };
      mockRepository.findById.mockResolvedValue(mockAchievement);

      await expect(service.update(achievementId, updateDtoPrivate)).rejects.toThrow(BadRequestException);
      await expect(service.update(achievementId, updateDtoPrivate)).rejects.toThrow(
        'Для rarity="private" questId обязателен'
      );
    });

    it('should nullify questId when updating rarity from private to other', async () => {
      const updateDtoCommon: UpdateAchievementDto = {
        rarity: 'common',
      };
      const updatedAchievement = { ...mockPrivateAchievement, rarity: 'common', questId: null };
      mockRepository.findById.mockResolvedValue(mockPrivateAchievement);
      mockRepository.update.mockResolvedValue(updatedAchievement);

      const result = await service.update(achievementId, updateDtoCommon);

      expect(result).toEqual(updatedAchievement);
      expect(mockRepository.update).toHaveBeenCalledWith(achievementId, {
        ...updateDtoCommon,
        questId: null,
      });
    });
  });

  describe('remove', () => {
    it('should successfully remove achievement (soft delete)', async () => {
      const achievementId = 1;
      const deletedAchievement = { ...mockAchievement, recordStatus: 'DELETED' };
      mockRepository.softDelete.mockResolvedValue(deletedAchievement);

      const result = await service.remove(achievementId);

      expect(result).toEqual(deletedAchievement);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(achievementId);
    });

    it('should throw NotFoundException for non-existent id', async () => {
      const achievementId = 999;
      mockRepository.softDelete.mockResolvedValue(undefined);

      await expect(service.remove(achievementId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(achievementId)).rejects.toThrow(
        `Достижение с ID ${achievementId} не найдено`
      );
      expect(mockRepository.softDelete).toHaveBeenCalledWith(achievementId);
    });
  });

  describe('assignToUser', () => {
    const userId = 1;
    const achievementId = 1;

    it('should successfully assign achievement to user', async () => {
      mockRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findById.mockResolvedValue(mockAchievement);
      mockRepository.findUserAchievement.mockResolvedValue(undefined);
      mockRepository.assignToUser.mockResolvedValue(mockUserAchievement);

      const result = await service.assignToUser(userId, achievementId);

      expect(result).toEqual(mockUserAchievement);
      expect(mockRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findById).toHaveBeenCalledWith(achievementId);
      expect(mockRepository.findUserAchievement).toHaveBeenCalledWith(userId, achievementId);
      expect(mockRepository.assignToUser).toHaveBeenCalledWith(userId, achievementId);
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockRepository.findUserById.mockResolvedValue(undefined);

      await expect(service.assignToUser(userId, achievementId)).rejects.toThrow(NotFoundException);
      await expect(service.assignToUser(userId, achievementId)).rejects.toThrow(
        `Пользователь с ID ${userId} не найден`
      );
      expect(mockRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockRepository.assignToUser).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when achievement is not found', async () => {
      mockRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findById.mockResolvedValue(undefined);

      await expect(service.assignToUser(userId, achievementId)).rejects.toThrow(NotFoundException);
      await expect(service.assignToUser(userId, achievementId)).rejects.toThrow(
        `Достижение с ID ${achievementId} не найдено`
      );
      expect(mockRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findById).toHaveBeenCalledWith(achievementId);
      expect(mockRepository.assignToUser).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when achievement already assigned', async () => {
      mockRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findById.mockResolvedValue(mockAchievement);
      mockRepository.findUserAchievement.mockResolvedValue(mockUserAchievement);

      await expect(service.assignToUser(userId, achievementId)).rejects.toThrow(ConflictException);
      await expect(service.assignToUser(userId, achievementId)).rejects.toThrow(
        'Пользователь уже получил это достижение'
      );
      expect(mockRepository.findUserAchievement).toHaveBeenCalledWith(userId, achievementId);
      expect(mockRepository.assignToUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserAchievements', () => {
    const userId = 1;

    it('should successfully return user achievements list', async () => {
      const achievements = [mockUserAchievementWithDetails];
      mockRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findUserAchievements.mockResolvedValue(achievements);

      const result = await service.getUserAchievements(userId);

      expect(result).toEqual(achievements);
      expect(mockRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findUserAchievements).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user is not found', async () => {
      mockRepository.findUserById.mockResolvedValue(undefined);

      await expect(service.getUserAchievements(userId)).rejects.toThrow(NotFoundException);
      await expect(service.getUserAchievements(userId)).rejects.toThrow(
        `Пользователь с ID ${userId} не найден`
      );
      expect(mockRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(mockRepository.findUserAchievements).not.toHaveBeenCalled();
    });

    it('should return empty array for user without achievements', async () => {
      mockRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.findUserAchievements.mockResolvedValue([]);

      const result = await service.getUserAchievements(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockRepository.findUserAchievements).toHaveBeenCalledWith(userId);
    });
  });
});

