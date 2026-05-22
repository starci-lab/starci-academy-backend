/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { UserEntity } from "../entities"
import { UsersController } from "."
import { UsersService } from "."

/**
 * Module người dùng — import TypeORM feature cho UserEntity, đăng ký controller và service.
 * (EN: Users module — imports TypeORM feature for UserEntity, registers controller and service.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    controllers: [UsersController],
    providers: [UsersService],
})
/**
 * Class `UsersModule` — thành phần lab (controller/service/module).
 * (EN: Class `UsersModule` — lesson lab component.)
 */
export class UsersModule {}

