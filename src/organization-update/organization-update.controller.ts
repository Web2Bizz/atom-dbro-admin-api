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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationUpdateService } from './organization-update.service';
import { CreateOrganizationUpdateDto, createOrganizationUpdateSchema, CreateOrganizationUpdateDtoClass } from './dto/create-organization-update.dto';
import { UpdateOrganizationUpdateDto, updateOrganizationUpdateSchema, UpdateOrganizationUpdateDtoClass } from './dto/update-organization-update.dto';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';

@ApiTags('Обновления организаций')
@Controller('organization-updates')
export class OrganizationUpdateController {
  constructor(private readonly organizationUpdateService: OrganizationUpdateService) {}

  @Post()
  @ZodValidation(createOrganizationUpdateSchema)
  @ApiOperation({ summary: 'Создать обновление организации' })
  @ApiBody({ type: CreateOrganizationUpdateDtoClass })
  @ApiResponse({ status: 201, description: 'Обновление организации успешно создано', type: CreateOrganizationUpdateDtoClass })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() createOrganizationUpdateDto: CreateOrganizationUpdateDto) {
    return this.organizationUpdateService.create(createOrganizationUpdateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все обновления организаций' })
  @ApiQuery({ 
    name: 'organizationId', 
    required: false, 
    type: Number,
    description: 'ID организации для фильтрации' 
  })
  @ApiResponse({ status: 200, description: 'Список обновлений организаций' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll(@Query('organizationId', new ParseIntPipe({ optional: true })) organizationId?: number) {
    return this.organizationUpdateService.findAll(organizationId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить обновление организации по ID' })
  @ApiResponse({ status: 200, description: 'Обновление организации найдено' })
  @ApiResponse({ status: 404, description: 'Обновление организации не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationUpdateService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodValidation(updateOrganizationUpdateSchema)
  @ApiOperation({ summary: 'Обновить обновление организации' })
  @ApiBody({ type: UpdateOrganizationUpdateDtoClass })
  @ApiResponse({ status: 200, description: 'Обновление организации обновлено', type: UpdateOrganizationUpdateDtoClass })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 404, description: 'Обновление организации или организация не найдены' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrganizationUpdateDto: UpdateOrganizationUpdateDto,
  ) {
    return this.organizationUpdateService.update(id, updateOrganizationUpdateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить обновление организации' })
  @ApiResponse({ status: 200, description: 'Обновление организации удалено' })
  @ApiResponse({ status: 404, description: 'Обновление организации не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organizationUpdateService.remove(id);
  }
}

