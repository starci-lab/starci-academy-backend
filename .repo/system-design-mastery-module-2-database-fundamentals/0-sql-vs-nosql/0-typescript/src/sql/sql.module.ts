/**
 * Nest feature module — registers controllers/services/providers for SQL.
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
 * SQL module — TypeOrmModule.forFeature to inject Repository<ProductEntity>.
 */
@Module({
    imports: [
                // Register ProductEntity to enable Repository injection.
        TypeOrmModule.forFeature([ProductEntity]),
    ],
    controllers: [SqlController],
    providers: [SqlService],
    exports: [SqlService],
})
/**
 * Class `SqlModule` — lesson lab component.
 */
export class SqlModule {}
