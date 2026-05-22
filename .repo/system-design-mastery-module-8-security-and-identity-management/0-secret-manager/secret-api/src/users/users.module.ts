/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from "../entities";
import { UsersController } from '.';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
})
/**
 * Class `UsersModule` — thành phần lab (controller/service/module).
 * (EN: Class `UsersModule` — lesson lab component.)
 */
export class UsersModule {}
