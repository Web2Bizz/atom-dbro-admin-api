import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RegionService } from './region.service';
import { CreateRegionDto, createRegionSchema, CreateRegionDtoClass } from './dto/create-region.dto';
import { UpdateRegionDto, updateRegionSchema, UpdateRegionDtoClass } from './dto/update-region.dto';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Регионы')
@Controller('regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Post()
  @ZodValidation(createRegionSchema)
  @ApiOperation({ summary: 'Создать регион' })
  @ApiBody({ type: CreateRegionDtoClass })
  @ApiResponse({ status: 201, description: 'Регион успешно создан', type: CreateRegionDtoClass })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionService.create(createRegionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все регионы' })
  @ApiResponse({ status: 200, description: 'Список регионов' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll() {
    return this.regionService.findAll();
  }

  @Get(':id/cities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все города региона' })
  @ApiResponse({ status: 200, description: 'Список городов региона' })
  @ApiResponse({ status: 404, description: 'Регион не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findCitiesByRegion(@Param('id', ParseIntPipe) id: number) {
    return this.regionService.findCitiesByRegion(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить регион по ID' })
  @ApiResponse({ status: 200, description: 'Регион найден' })
  @ApiResponse({ status: 404, description: 'Регион не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.regionService.findOne(id);
  }

  @Patch(':id')
  @ZodValidation(updateRegionSchema)
  @ApiOperation({ summary: 'Обновить регион' })
  @ApiBody({ type: UpdateRegionDtoClass })
  @ApiResponse({ status: 200, description: 'Регион обновлен', type: UpdateRegionDtoClass })
  @ApiResponse({ status: 404, description: 'Регион не найден' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRegionDto: UpdateRegionDto,
  ) {
    return this.regionService.update(id, updateRegionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить регион' })
  @ApiResponse({ status: 200, description: 'Регион удален' })
  @ApiResponse({ status: 404, description: 'Регион не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.regionService.remove(id);
  }
}

