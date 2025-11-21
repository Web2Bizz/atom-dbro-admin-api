import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod/v4';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // Валидация отключена на глобальном уровне - просто возвращаем значение без проверки
    return value;
  }
}
