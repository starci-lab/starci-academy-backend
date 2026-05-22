/**
 * Nest feature module — dang ky controller/service/providers cho SQL.
 * (EN: Nest feature module — registers controllers/services/providers for SQL.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    ProductEntity,
} from "./entities/product.entity"
import {
    SqlController,
} from "./sql.controller"
import {
    SqlService,
} from "./sql.service"

/**
 * Module SQL — TypeOrmModule.forFeature de inject Repository<ProductEntity>.
 * (EN: SQL module — TypeOrmModule.forFeature to inject Repository<ProductEntity>.)
 */
@Module({
    imports: [
        // Dang ky entity ProductEntity de co the inject Repository.
        // (EN: Register ProductEntity to enable Repository injection.)
        TypeOrmModule.forFeature([ProductEntity]),
    ],
    controllers: [SqlController],
    providers: [SqlService],
    exports: [SqlService],
})
/**
 * Class `SqlModule` — thanh phan lab (controller/service/module).
 * (EN: Class `SqlModule` — lesson lab component.)
 */
export class SqlModule {}
