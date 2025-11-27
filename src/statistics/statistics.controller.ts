import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Статистика')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить статистику системы' })
  @ApiResponse({
    status: 200,
    description: 'Статистика успешно получена',
    schema: {
      type: 'object',
      properties: {
        citiesCount: { type: 'number', description: 'Количество городов' },
        regionsCount: { type: 'number', description: 'Количество регионов' },
        usersCount: { type: 'number', description: 'Количество пользователей' },
        organizationsCount: { type: 'number', description: 'Количество организаций' },
        totalQuests: { type: 'number', description: 'Всего квестов' },
        activeQuests: { type: 'number', description: 'Активные квесты' },
        completedQuests: { type: 'number', description: 'Завершённые квесты' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getStatistics() {
    return this.statisticsService.getStatistics();
  }
}

