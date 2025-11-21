import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { S3Service } from '../organization/s3.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Загрузка файлов')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('images', 20), // Максимум 20 файлов
  )
  @ApiOperation({ summary: 'Загрузить множество изображений на S3 хранилище' })
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
  @ApiResponse({
    status: 201,
    description: 'Изображения успешно загружены',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fileName: {
            type: 'string',
            description: 'Название файла (ключ в S3)',
            example: 'uploads/550e8400-e29b-41d4-a716-446655440000.jpg',
          },
          url: {
            type: 'string',
            description: 'Полный путь к файлу (URL)',
            example: 'https://bucket.s3.region.amazonaws.com/uploads/550e8400-e29b-41d4-a716-446655440000.jpg',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Неверные данные или файлы не загружены' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async uploadImages(
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<Array<{ fileName: string; url: string }>> {
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

    // Загружаем файлы на S3 и получаем информацию о каждом файле
    const uploadResults = await this.s3Service.uploadMultipleImagesWithUrl(files, 'images');

    return uploadResults;
  }
}

