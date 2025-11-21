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
import { OrganizationTypeService } from './organization-type.service';
import { CreateOrganizationTypeDto, createOrganizationTypeSchema, CreateOrganizationTypeDtoClass } from './dto/create-organization-type.dto';
import { UpdateOrganizationTypeDto, updateOrganizationTypeSchema, UpdateOrganizationTypeDtoClass } from './dto/update-organization-type.dto';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Типы организаций')
@Controller('organization-types')
export class OrganizationTypeController {
  constructor(private readonly organizationTypeService: OrganizationTypeService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodValidation(createOrganizationTypeSchema)
  @ApiOperation({ summary: 'Создать тип организации' })
  @ApiBody({ type: CreateOrganizationTypeDtoClass })
  @ApiResponse({ status: 201, description: 'Тип организации успешно создан', type: CreateOrganizationTypeDtoClass })
  @ApiResponse({ status: 400, description: 'Тип организации с таким названием уже существует' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  create(@Body() createOrganizationTypeDto: CreateOrganizationTypeDto) {
    return this.organizationTypeService.create(createOrganizationTypeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все типы организаций' })
  @ApiResponse({ status: 200, description: 'Список типов организаций' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll() {
    return this.organizationTypeService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить тип организации по ID' })
  @ApiResponse({ status: 200, description: 'Тип организации найден' })
  @ApiResponse({ status: 404, description: 'Тип организации не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationTypeService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodValidation(updateOrganizationTypeSchema)
  @ApiOperation({ summary: 'Обновить тип организации' })
  @ApiBody({ type: UpdateOrganizationTypeDtoClass })
  @ApiResponse({ status: 200, description: 'Тип организации обновлен', type: UpdateOrganizationTypeDtoClass })
  @ApiResponse({ status: 400, description: 'Тип организации с таким названием уже существует' })
  @ApiResponse({ status: 404, description: 'Тип организации не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrganizationTypeDto: UpdateOrganizationTypeDto,
  ) {
    return this.organizationTypeService.update(id, updateOrganizationTypeDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить тип организации' })
  @ApiResponse({ status: 200, description: 'Тип организации удален' })
  @ApiResponse({ status: 404, description: 'Тип организации не найден' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organizationTypeService.remove(id);
  }
}

