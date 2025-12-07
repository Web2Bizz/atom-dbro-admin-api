import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { AchievementRepository } from './achievement.repository';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';

@Injectable()
export class AchievementService {
  constructor(
    @Inject(AchievementRepository)
    private repository: AchievementRepository,
  ) {}

  async create(createAchievementDto: CreateAchievementDto) {
    // Проверяем уникальность названия (исключая удаленные записи)
    const existingAchievement = await this.repository.findByTitle(createAchievementDto.title);
    if (existingAchievement) {
      throw new ConflictException('Достижение с таким названием уже существует');
    }

    // Валидация связи rarity и questId
    if (createAchievementDto.rarity === 'private') {
      if (!createAchievementDto.questId || createAchievementDto.questId === null) {
        throw new BadRequestException('Для rarity="private" questId обязателен');
      }
      // Проверяем существование квеста
      const quest = await this.repository.findQuestById(createAchievementDto.questId);
      if (!quest) {
        throw new NotFoundException(`Квест с ID ${createAchievementDto.questId} не найден`);
      }
    } else {
      // Для других значений rarity questId должен быть null или отсутствовать
      if (createAchievementDto.questId !== null && createAchievementDto.questId !== undefined) {
        throw new BadRequestException('Для rarity отличной от "private" questId должен быть null или отсутствовать');
      }
    }

    return await this.repository.create(createAchievementDto);
  }

  async findAll() {
    return await this.repository.findAll();
  }

  async findOne(id: number) {
    const achievement = await this.repository.findById(id);
    if (!achievement) {
      throw new NotFoundException(`Достижение с ID ${id} не найдено`);
    }
    return achievement;
  }

  async update(id: number, updateAchievementDto: UpdateAchievementDto) {
    // Получаем текущее достижение для проверки текущего значения rarity
    const currentAchievement = await this.repository.findById(id);
    if (!currentAchievement) {
      throw new NotFoundException(`Достижение с ID ${id} не найдено`);
    }

    // Если обновляется название, проверяем уникальность (исключая удаленные записи)
    if (updateAchievementDto.title) {
      const existingAchievement = await this.repository.findByTitleExcludingId(
        updateAchievementDto.title,
        id
      );
      if (existingAchievement) {
        throw new ConflictException('Достижение с таким названием уже существует');
      }
    }

    // Определяем финальное значение rarity (новое или текущее)
    const finalRarity = updateAchievementDto.rarity !== undefined 
      ? updateAchievementDto.rarity 
      : currentAchievement.rarity;

    // Валидация связи rarity и questId
    if (finalRarity === 'private') {
      // Если обновляется на 'private', questId обязателен
      if (updateAchievementDto.questId !== undefined) {
        if (!updateAchievementDto.questId || updateAchievementDto.questId === null) {
          throw new BadRequestException('Для rarity="private" questId обязателен');
        }
        // Проверяем существование квеста
        const quest = await this.repository.findQuestById(updateAchievementDto.questId);
        if (!quest) {
          throw new NotFoundException(`Квест с ID ${updateAchievementDto.questId} не найден`);
        }
      } else if (!currentAchievement.questId) {
        // Если questId не передается, но текущего тоже нет - ошибка
        throw new BadRequestException('Для rarity="private" questId обязателен');
      }
    } else {
      // Если обновляется на значение отличное от 'private', questId должен быть null
      if (updateAchievementDto.rarity !== undefined && updateAchievementDto.rarity !== 'private') {
        // Обнуляем questId при смене rarity с 'private' на другое значение
        updateAchievementDto.questId = null;
      } else if (updateAchievementDto.questId !== null && updateAchievementDto.questId !== undefined) {
        // Если questId передается явно для не-private rarity - ошибка
        throw new BadRequestException('Для rarity отличной от "private" questId должен быть null или отсутствовать');
      }
    }

    const achievement = await this.repository.update(id, updateAchievementDto);
    if (!achievement) {
      throw new NotFoundException(`Достижение с ID ${id} не найдено`);
    }
    return achievement;
  }

  async remove(id: number) {
    const achievement = await this.repository.softDelete(id);
    if (!achievement) {
      throw new NotFoundException(`Достижение с ID ${id} не найдено`);
    }
    return achievement;
  }

  async assignToUser(userId: number, achievementId: number) {
    // Проверяем существование пользователя (исключая удаленные)
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    // Проверяем существование достижения (исключая удаленные)
    const achievement = await this.repository.findById(achievementId);
    if (!achievement) {
      throw new NotFoundException(`Достижение с ID ${achievementId} не найдено`);
    }

    // Проверяем, не получено ли уже это достижение пользователем
    const existingUserAchievement = await this.repository.findUserAchievement(
      userId,
      achievementId
    );
    if (existingUserAchievement) {
      throw new ConflictException('Пользователь уже получил это достижение');
    }

    // Присваиваем достижение пользователю
    return await this.repository.assignToUser(userId, achievementId);
  }

  async getUserAchievements(userId: number) {
    // Проверяем существование пользователя (исключая удаленные)
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    // Получаем все достижения пользователя с информацией о достижении (исключая удаленные достижения)
    return await this.repository.findUserAchievements(userId);
  }
}

