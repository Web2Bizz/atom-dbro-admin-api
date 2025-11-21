import { Module } from '@nestjs/common';
import { OrganizationTypeService } from './organization-type.service';
import { OrganizationTypeController } from './organization-type.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrganizationTypeController],
  providers: [OrganizationTypeService],
  exports: [OrganizationTypeService],
})
export class OrganizationTypeModule {}

