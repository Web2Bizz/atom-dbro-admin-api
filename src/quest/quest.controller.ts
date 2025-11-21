import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { QuestService } from './quest.service';
import { QuestEventsService } from './quest.events';
import { CreateQuestDto, createQuestSchema, CreateQuestDtoClass } from './dto/create-quest.dto';
import { UpdateQuestDto, updateQuestSchema, UpdateQuestDtoClass } from './dto/update-quest.dto';
import { UpdateRequirementDto, updateRequirementSchema, UpdateRequirementDtoClass } from './dto/update-requirement.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';

@ApiTags('Квесты')
@Controller('quests')
export class QuestController {
  constructor(
    private readonly questService: QuestService,
    private readonly questEventsService: QuestEventsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ZodValidation(createQuestSchema)
  @ApiOperation({ summary: 'Создать квест' })
  @ApiBody({ type: CreateQuestDtoClass })
  @ApiResponse({ status: 201, description: 'Квест успешно создан', type: CreateQuestDtoClass })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 403, description: 'Недостаточный уровень для создания квеста (требуется уровень 5+)' })
  create(
    @Body() createQuestDto: CreateQuestDto,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.questService.create(createQuestDto, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все квесты' })
  @ApiQuery({ 
    name: 'cityId', 
    required: false, 
    type: Number,
    description: 'ID города для фильтрации' 
  })
  @ApiQuery({ 
    name: 'categoryId', 
    required: false, 
    type: Number,
    description: 'ID категории для фильтрации' 
  })
  @ApiResponse({ status: 200, description: 'Список квестов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll(
    @Query('cityId', new ParseIntPipe({ optional: true })) cityId?: number,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
  ) {
    return this.questService.findAll(cityId, categoryId);
  }

  @Get('filter')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить квесты с фильтрацией по статусу, городу и категории' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['active', 'archived', 'completed'],
    description: 'Статус квеста для фильтрации' 
  })
  @ApiQuery({ 
    name: 'cityId', 
    required: false, 
    type: Number,
    description: 'ID города для фильтрации' 
  })
  @ApiQuery({ 
    name: 'categoryId', 
    required: false, 
    type: Number,
    description: 'ID категории для фильтрации' 
  })
  @ApiResponse({ status: 200, description: 'Список квестов с примененными фильтрами' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  filter(
    @Query('status') status?: 'active' | 'archived' | 'completed',
    @Query('cityId', new ParseIntPipe({ optional: true })) cityId?: number,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
  ) {
    if (status && !['active', 'archived', 'completed'].includes(status)) {
      throw new BadRequestException('Недопустимый статус. Допустимые значения: active, archived, completed');
    }
    return this.questService.findByStatus(status, cityId, categoryId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить квест по ID' })
  @ApiResponse({ status: 200, description: 'Квест найден' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ZodValidation(updateQuestSchema)
  @ApiOperation({ summary: 'Обновить квест' })
  @ApiBody({ type: UpdateQuestDtoClass })
  @ApiResponse({ status: 200, description: 'Квест обновлен', type: UpdateQuestDtoClass })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestDto: UpdateQuestDto,
  ) {
    return this.questService.update(id, updateQuestDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить квест (требуется авторизация)' })
  @ApiResponse({ status: 200, description: 'Квест удален' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questService.remove(id);
  }

  @Post(':id/join/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Присоединиться к квесту' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно присоединился к квесту' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь или квест не найден' })
  @ApiResponse({ status: 409, description: 'Пользователь уже присоединился к этому квесту' })
  @ApiResponse({ status: 400, description: 'Квест не доступен для выполнения' })
  joinQuest(
    @Param('id', ParseIntPipe) questId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.questService.joinQuest(userId, questId);
  }

  @Post(':id/leave/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Покинуть квест' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно покинул квест' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь или квест не найден, либо пользователь не участвует в квесте' })
  @ApiResponse({ status: 400, description: 'Нельзя покинуть уже завершенный квест' })
  leaveQuest(
    @Param('id', ParseIntPipe) questId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.questService.leaveQuest(userId, questId);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Завершить квест' })
  @ApiResponse({ status: 200, description: 'Квест успешно завершен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь или квест не найден' })
  @ApiResponse({ status: 409, description: 'Квест уже выполнен' })
  completeQuest(
    @Param('id', ParseIntPipe) questId: number,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.questService.completeQuest(user.userId, questId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить квесты пользователя' })
  @ApiResponse({ status: 200, description: 'Список квестов пользователя' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  getUserQuests(@Param('userId', ParseIntPipe) userId: number) {
    return this.questService.getUserQuests(userId);
  }

  @Get('available/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить доступные квесты для пользователя' })
  @ApiResponse({ status: 200, description: 'Список доступных квестов' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  getAvailableQuests(@Param('userId', ParseIntPipe) userId: number) {
    return this.questService.getAvailableQuests(userId);
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Sse('events')
  @ApiOperation({ summary: 'Подписаться на события квестов (Server-Sent Events)' })
  @ApiResponse({ status: 200, description: 'Поток событий квестов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  streamQuestEvents(): Observable<MessageEvent> {
    return this.questEventsService.getQuestEvents();
  }

  @Get('events/:questId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Sse('events/:questId')
  @ApiOperation({ summary: 'Подписаться на события конкретного квеста (Server-Sent Events)' })
  @ApiResponse({ status: 200, description: 'Поток событий для конкретного квеста' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  streamQuestEventsByQuestId(@Param('questId', ParseIntPipe) questId: number): Observable<MessageEvent> {
    return this.questEventsService.getQuestEventsByQuestId(questId);
  }

  @Patch(':id/steps/:stepIndex/requirement')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ZodValidation(updateRequirementSchema)
  @ApiOperation({ summary: 'Обновить currentValue требования в этапе квеста' })
  @ApiBody({ type: UpdateRequirementDtoClass })
  @ApiResponse({ status: 200, description: 'Требование успешно обновлено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Квест или этап не найден' })
  @ApiResponse({ status: 400, description: 'Некорректные данные или статус квеста' })
  updateRequirementCurrentValue(
    @Param('id', ParseIntPipe) questId: number,
    @Param('stepIndex', ParseIntPipe) stepIndex: number,
    @Body() updateRequirementDto: UpdateRequirementDto,
  ) {
    return this.questService.updateRequirementCurrentValue(questId, stepIndex, updateRequirementDto);
  }
}

