import { applyDecorators, UsePipes } from '@nestjs/common';
import { ZodSchema } from 'zod/v4';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

export function ZodValidation(schema: ZodSchema) {
  return applyDecorators(
    UsePipes(new ZodValidationPipe(schema)),
  );
}

