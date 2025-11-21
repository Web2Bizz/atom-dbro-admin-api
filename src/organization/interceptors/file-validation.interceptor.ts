import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Интерцептор для валидации загружаемых файлов
 * Проверяет размер и тип файла
 */
@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor() {
    // Максимальный размер файла: 10MB (можно настроить через env)
    this.maxFileSize = 10 * 1024 * 1024; // 10MB в байтах
    // Разрешенные типы изображений
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const files = request.files as Express.Multer.File[];

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        // Проверка размера файла
        if (file.size > this.maxFileSize) {
          throw new BadRequestException(
            `Файл "${file.originalname}" (${index + 1}) превышает максимальный размер ${this.maxFileSize / 1024 / 1024}MB`,
          );
        }

        // Проверка типа файла
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            `Файл "${file.originalname}" (${index + 1}) имеет недопустимый тип. Разрешены только: ${this.allowedMimeTypes.join(', ')}`,
          );
        }

        // Дополнительная проверка расширения файла
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          throw new BadRequestException(
            `Файл "${file.originalname}" (${index + 1}) имеет недопустимое расширение. Разрешены только: ${allowedExtensions.join(', ')}`,
          );
        }
      });
    }

    return next.handle();
  }
}

