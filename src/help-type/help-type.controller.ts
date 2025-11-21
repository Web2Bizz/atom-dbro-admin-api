import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HelpTypeService } from './help-type.service';
import { CreateHelpTypeDto, createHelpTypeSchema, CreateHelpTypeDtoClass } from './dto/create-help-type.dto';
import { UpdateHelpTypeDto, updateHelpTypeSchema, UpdateHelpTypeDtoClass } from './dto/update-help-type.dto';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';

@ApiTags('Виды помощи')
@Controller('help-types')
export class HelpTypeController {
  constructor(private readonly helpTypeService: HelpTypeService) {}

  @Post()
  @ZodValidation(createHelpTypeSchema)
  @ApiOperation({ summary: 'Создать вид помощи' })
  @ApiBody({ type: CreateHelpTypeDtoClass })
  @ApiResponse({ status: 201, description: 'Вид помощи успешно создан', type: CreateHelpTypeDtoClass })
  @ApiResponse({ status: 400, description: 'Вид помощи с таким названием уже существует' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() createHelpTypeDto: CreateHelpTypeDto) {
    return this.helpTypeService.create(createHelpTypeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все виды помощи' })
  @ApiResponse({ status: 200, description: 'Список видов помощи' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll() {
    return this.helpTypeService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить вид помощи по ID' })
  @ApiResponse({ status: 200, description: 'Вид помощи найден' })
  @ApiResponse({ status: 404, description: 'Вид помощи не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.helpTypeService.findOne(id);
  }

  @Patch(':id')
  @ZodValidation(updateHelpTypeSchema)
  @ApiOperation({ summary: 'Обновить вид помощи' })
  @ApiBody({ type: UpdateHelpTypeDtoClass })
  @ApiResponse({ status: 200, description: 'Вид помощи обновлен', type: UpdateHelpTypeDtoClass })
  @ApiResponse({ status: 400, description: 'Вид помощи с таким названием уже существует' })
  @ApiResponse({ status: 404, description: 'Вид помощи не найден' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHelpTypeDto: UpdateHelpTypeDto,
  ) {
    return this.helpTypeService.update(id, updateHelpTypeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить вид помощи' })
  @ApiResponse({ status: 200, description: 'Вид помощи удален' })
  @ApiResponse({ status: 404, description: 'Вид помощи не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.helpTypeService.remove(id);
  }
}

