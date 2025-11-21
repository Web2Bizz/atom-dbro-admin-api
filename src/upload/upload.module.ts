import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { S3Service } from '../organization/s3.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
  providers: [S3Service],
})
export class UploadModule {}

