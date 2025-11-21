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
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Res,
  NotFoundException,
  Version,
  HttpCode,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { OrganizationService } from './organization.service';
import { S3Service } from './s3.service';
import { CreateOrganizationDto, createOrganizationSchema, CreateOrganizationDtoClass } from './dto/create-organization.dto';
import { UpdateOrganizationDto, updateOrganizationSchema, UpdateOrganizationDtoClass } from './dto/update-organization.dto';
import { AddOwnerDto, addOwnerSchema, AddOwnerDtoClass } from './dto/add-owner.dto';
import { AddHelpTypeDto, addHelpTypeSchema, AddHelpTypeDtoClass } from './dto/add-help-type.dto';
import { CreateOrganizationsBulkDto, createOrganizationsBulkSchema } from './dto/create-organizations-bulk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ZodValidation } from '../common/decorators/zod-validation.decorator';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@ApiTags('Организации')
@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @ZodValidation(createOrganizationSchema)
  @ApiOperation({ summary: 'Создать организацию' })
  @ApiBody({ type: CreateOrganizationDtoClass })
  @ApiResponse({ status: 201, description: 'Организация успешно создана', type: CreateOrganizationDtoClass })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.organizationService.create(createOrganizationDto, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить все организации1' })
  @ApiResponse({ status: 200, description: 'Список организаций' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findAll() {
    return this.organizationService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить организацию по ID' })
  @ApiResponse({ status: 200, description: 'Организация найдена' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodValidation(updateOrganizationSchema)
  @ApiOperation({ summary: 'Обновить организацию' })
  @ApiBody({ type: UpdateOrganizationDtoClass })
  @ApiResponse({ status: 200, description: 'Организация обновлена', type: UpdateOrganizationDtoClass })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, updateOrganizationDto);
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Подтвердить организацию' })
  @ApiResponse({ status: 200, description: 'Организация успешно подтверждена' })
  @ApiResponse({ status: 400, description: 'Организация уже подтверждена' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  approveOrganization(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.approveOrganization(id);
  }

  @Patch(':id/disapprove')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Отменить подтверждение организации' })
  @ApiResponse({ status: 200, description: 'Подтверждение организации успешно отменено' })
  @ApiResponse({ status: 400, description: 'Организация не подтверждена, отмена невозможна' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  disapproveOrganization(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.disapproveOrganization(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить организацию' })
  @ApiResponse({ status: 200, description: 'Организация удалена' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.remove(id);
  }

  @Post(':id/owners')
  @ZodValidation(addOwnerSchema)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Добавить владельца организации' })
  @ApiBody({ type: AddOwnerDtoClass })
  @ApiResponse({ status: 201, description: 'Владелец успешно добавлен', type: AddOwnerDtoClass })
  @ApiResponse({ status: 404, description: 'Организация или пользователь не найдены' })
  @ApiResponse({ status: 409, description: 'Пользователь уже является владельцем организации' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  addOwner(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() addOwnerDto: AddOwnerDto,
  ) {
    return this.organizationService.addOwner(organizationId, addOwnerDto.userId);
  }

  @Delete(':id/owners/:userId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить владельца организации' })
  @ApiResponse({ status: 200, description: 'Владелец успешно удален' })
  @ApiResponse({ status: 404, description: 'Связь не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  removeOwner(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.organizationService.removeOwner(organizationId, userId);
  }

  @Post(':id/help-types')
  @ZodValidation(addHelpTypeSchema)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Добавить вид помощи организации' })
  @ApiBody({ type: AddHelpTypeDtoClass })
  @ApiResponse({ status: 201, description: 'Вид помощи успешно добавлен', type: AddHelpTypeDtoClass })
  @ApiResponse({ status: 404, description: 'Организация или вид помощи не найдены' })
  @ApiResponse({ status: 409, description: 'Вид помощи уже добавлен к организации' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  addHelpType(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() addHelpTypeDto: AddHelpTypeDto,
  ) {
    return this.organizationService.addHelpType(organizationId, addHelpTypeDto.helpTypeId);
  }

  @Delete(':id/help-types/:helpTypeId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить вид помощи организации' })
  @ApiResponse({ status: 200, description: 'Вид помощи успешно удален' })
  @ApiResponse({ status: 404, description: 'Связь не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  removeHelpType(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('helpTypeId', ParseIntPipe) helpTypeId: number,
  ) {
    return this.organizationService.removeHelpType(organizationId, helpTypeId);
  }

  @Post(':id/gallery')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 20), // Максимум 20 файлов
  )
  @ApiOperation({ summary: 'Загрузить изображения в галерею организации' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Изображения успешно загружены' })
  @ApiResponse({ status: 404, description: 'Организация не найдена' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async uploadImages(
    @Param('id', ParseIntPipe) organizationId: number,
    @UploadedFiles() files: Array<MulterFile>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Необходимо загрузить хотя бы одно изображение');
    }

    // Валидация файлов
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    files.forEach((file, index) => {
      // Проверка размера файла
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          `Файл "${file.originalname}" (${index + 1}) превышает максимальный размер 10MB`,
        );
      }

      // Проверка типа файла
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Файл "${file.originalname}" (${index + 1}) имеет недопустимый тип. Разрешены только: ${allowedMimeTypes.join(', ')}`,
        );
      }

      // Проверка расширения файла
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `Файл "${file.originalname}" (${index + 1}) имеет недопустимое расширение. Разрешены только: ${allowedExtensions.join(', ')}`,
        );
      }
    });

    const imageFileNames = await this.s3Service.uploadMultipleImages(files, organizationId);
    return this.organizationService.addImagesToGallery(organizationId, imageFileNames);
  }

  @Get(':id/gallery/:fileName')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить изображение из галереи организации (шлюз)' })
  @ApiResponse({ status: 200, description: 'Изображение найдено', content: { 'image/*': {} } })
  @ApiResponse({ status: 404, description: 'Изображение не найдено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getImage(
    @Param('id', ParseIntPipe) organizationId: number,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    // Проверяем, что организация существует и файл принадлежит ей
    // Используем метод сервиса для проверки файла в галерее
    const fullFileName = `organizations/${organizationId}/${decodeURIComponent(fileName)}`;
    const isValid = await this.organizationService.checkImageInGallery(organizationId, fullFileName);
    
    if (!isValid) {
      throw new NotFoundException('Изображение не найдено в галерее организации');
    }

    try {
      // Получаем файл из S3
      const file = await this.s3Service.getFile(fullFileName);
      
      // Устанавливаем заголовки
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Length', file.body.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Кеш на 1 год
      
      // Отправляем файл
      res.send(file.body);
    } catch (error) {
      throw new NotFoundException('Изображение не найдено в хранилище');
    }
  }

  @Post()
  @Version('2')
  @HttpCode(201)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ZodValidation(createOrganizationsBulkSchema)
  @ApiOperation({ summary: 'Массовое добавление организаций (v2)' })
  @ApiBody({ 
    type: [CreateOrganizationDtoClass],
    description: 'Массив организаций для добавления. Если cityId = 0, город будет найден по адресу',
    examples: {
      example1: {
        value: [
          {
            name: 'ОО ТОС АГО "12а микрорайон"',
            cityId: 0,
            typeId: 2,
            helpTypeIds: [5, 8, 10],
            latitude: 52.5444,
            longitude: 103.8883,
            summary: 'Повышение качества жизни жителей',
            mission: 'Благоустройство территории',
            description: 'Описание организации',
            goals: ['Цель 1', 'Цель 2'],
            needs: ['Нужда 1'],
            address: 'г. Ангарск',
            contacts: [{ name: 'ВКонтакте', value: 'https://vk.com/example' }],
            gallery: ['https://example.com/image.jpg']
          }
        ]
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Организации успешно созданы',
    type: [CreateOrganizationDtoClass]
  })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 404, description: 'Один или несколько городов, типов организаций или видов помощи не найдены' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  createMany(
    @Body() createOrganizationsDto: CreateOrganizationsBulkDto,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.organizationService.createMany(createOrganizationsDto, user.userId);
  }
}

