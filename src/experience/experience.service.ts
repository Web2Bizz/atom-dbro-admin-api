import { Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class ExperienceService {
  constructor(private userService: UserService) {}

  /**
   * Рассчитывает уровень пользователя на основе его опыта.
   * Формула: требуемый опыт для уровня N = 100 * 1.5^(N-1)
   * Уровень 1: 0+ опыта (базовый уровень, всегда доступен)
   * Уровень 2: требуется минимум 100 * 1.5^1 = 150 опыта
   * Уровень 3: требуется минимум 100 * 1.5^2 = 225 опыта
   * Уровень 4: требуется минимум 100 * 1.5^3 = 337.5 опыта
   * @param experience Текущий опыт пользователя
   * @returns Максимальный достижимый уровень
   */
  calculateLevel(experience: number): number {
    if (experience < 0) {
      return 1;
    }

    // Уровень 1 доступен всегда (с 0 опыта)
    let level = 1;

    // Проверяем каждый следующий уровень, начиная с уровня 2
    while (true) {
      const nextLevel = level + 1;
      const requiredExperience = 100 * Math.pow(1.5, nextLevel - 1);

      // Если опыта недостаточно для следующего уровня, возвращаем текущий
      if (experience < requiredExperience) {
        return level;
      }

      level = nextLevel;
    }
  }

  /**
   * Добавляет опыт пользователю и автоматически пересчитывает уровень.
   * @param userId ID пользователя
   * @param amount Количество опыта для добавления
   * @returns Новый опыт и уровень пользователя
   */
  async addExperience(userId: number, amount: number) {
    // Получаем текущего пользователя
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    // Вычисляем новый опыт
    const newExperience = user.experience + amount;

    // Рассчитываем новый уровень на основе нового опыта
    const newLevel = this.calculateLevel(newExperience);

    // Обновляем опыт и уровень через приватный метод UserService
    await this.userService.updateExperienceAndLevel(userId, newExperience, newLevel);

    // Возвращаем только новый опыт и уровень
    return {
      level: newLevel,
      experience: newExperience,
    };
  }
}

