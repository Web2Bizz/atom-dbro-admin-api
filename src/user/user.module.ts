import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { DatabaseModule } from '../database/database.module';
import { AvatarModule } from '../avatar/avatar.module';

@Module({
  imports: [DatabaseModule, AvatarModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}

