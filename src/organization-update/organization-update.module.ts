import { Module } from '@nestjs/common';
import { OrganizationUpdateService } from './organization-update.service';
import { OrganizationUpdateController } from './organization-update.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrganizationUpdateController],
  providers: [OrganizationUpdateService],
  exports: [OrganizationUpdateService],
})
export class OrganizationUpdateModule {}

