import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { cities, regions, users, organizations, quests } from '../database/schema';
import { eq, and, ne, count } from 'drizzle-orm';

export interface StatisticsDto {
  citiesCount: number;
  regionsCount: number;
  usersCount: number;
  organizationsCount: number;
  totalQuests: number;
  activeQuests: number;
  completedQuests: number;
}

@Injectable()
export class StatisticsService {
  private cache: StatisticsDto | null = null;
  private cacheTime: number = 0;
  private readonly CACHE_TTL = 60 * 1000; // 1 минута в миллисекундах

  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: NodePgDatabase,
  ) {}

  async getStatistics(): Promise<StatisticsDto> {
    const now = Date.now();

    // Проверяем кеш
    if (this.cache && (now - this.cacheTime) < this.CACHE_TTL) {
      return this.cache;
    }

    // Выполняем все запросы параллельно для оптимизации
    const [
      citiesResult,
      regionsResult,
      usersResult,
      organizationsResult,
      totalQuestsResult,
      activeQuestsResult,
      completedQuestsResult,
    ] = await Promise.all([
      // Количество городов (исключая удаленные)
      this.db
        .select({ count: count(cities.id) })
        .from(cities)
        .where(ne(cities.recordStatus, 'DELETED')),

      // Количество регионов (исключая удаленные)
      this.db
        .select({ count: count(regions.id) })
        .from(regions)
        .where(ne(regions.recordStatus, 'DELETED')),

      // Количество пользователей (исключая удаленные)
      this.db
        .select({ count: count(users.id) })
        .from(users)
        .where(ne(users.recordStatus, 'DELETED')),

      // Количество организаций (исключая удаленные)
      this.db
        .select({ count: count(organizations.id) })
        .from(organizations)
        .where(ne(organizations.recordStatus, 'DELETED')),

      // Всего квестов (исключая удаленные)
      this.db
        .select({ count: count(quests.id) })
        .from(quests)
        .where(ne(quests.recordStatus, 'DELETED')),

      // Активные квесты (status = 'active', исключая удаленные)
      this.db
        .select({ count: count(quests.id) })
        .from(quests)
        .where(
          and(
            eq(quests.status, 'active'),
            ne(quests.recordStatus, 'DELETED'),
          ),
        ),

      // Завершённые квесты (status = 'completed', исключая удаленные)
      this.db
        .select({ count: count(quests.id) })
        .from(quests)
        .where(
          and(
            eq(quests.status, 'completed'),
            ne(quests.recordStatus, 'DELETED'),
          ),
        ),
    ]);

    const statistics: StatisticsDto = {
      citiesCount: citiesResult[0]?.count ?? 0,
      regionsCount: regionsResult[0]?.count ?? 0,
      usersCount: usersResult[0]?.count ?? 0,
      organizationsCount: organizationsResult[0]?.count ?? 0,
      totalQuests: totalQuestsResult[0]?.count ?? 0,
      activeQuests: activeQuestsResult[0]?.count ?? 0,
      completedQuests: completedQuestsResult[0]?.count ?? 0,
    };

    // Обновляем кеш
    this.cache = statistics;
    this.cacheTime = now;

    return statistics;
  }
}

