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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuestUpdateService } from './quest-update.service';
import { CreateQuestUpdateDto, createQuestUpdateSchema, CreateQuestUpdateDtoClass } from './dto/create-quest-update.dto';
import { UpdateQuestUpdateDto, updateQuestUpdateSchema, UpdateQuestUpdateDtoClass } from './dto/update-quest-update.dto';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';

@ApiTags('Обновления квестов')
@Controller('quest-updates')
export class QuestUpdateController {
  constructor(private readonly questUpdateService: QuestUpdateService) {}

  @Post()
  @ZodValidation(createQuestUpdateSchema)
  @ApiOperation({ summary: 'Создать обновление квеста' })
  @ApiBody({ type: CreateQuestUpdateDtoClass })
  @ApiResponse({ status: 201, description: 'Обновление квеста успешно создано', type: CreateQuestUpdateDtoClass })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 404, description: 'Квест не найден' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() createQuestUpdateDto: CreateQuestUpdateDto) {
    return this.questUpdateService.create(createQuestUpdateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все обновления квестов' })
  @ApiQuery({ 
    name: 'questId', 
    required: false, 
    type: Number,
    description: 'ID квеста для фильтрации' 
  })
  @ApiResponse({ status: 200, description: 'Список обновлений квестов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll(@Query('questId', new ParseIntPipe({ optional: true })) questId?: number) {
    return this.questUpdateService.findAll(questId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить обновление квеста по ID' })
  @ApiResponse({ status: 200, description: 'Обновление квеста найдено' })
  @ApiResponse({ status: 404, description: 'Обновление квеста не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questUpdateService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodValidation(updateQuestUpdateSchema)
  @ApiOperation({ summary: 'Обновить обновление квеста' })
  @ApiBody({ type: UpdateQuestUpdateDtoClass })
  @ApiResponse({ status: 200, description: 'Обновление квеста обновлено', type: UpdateQuestUpdateDtoClass })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 404, description: 'Обновление квеста или квест не найдены' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestUpdateDto: UpdateQuestUpdateDto,
  ) {
    return this.questUpdateService.update(id, updateQuestUpdateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить обновление квеста' })
  @ApiResponse({ status: 200, description: 'Обновление квеста удалено' })
  @ApiResponse({ status: 404, description: 'Обновление квеста не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questUpdateService.remove(id);
  }
}

