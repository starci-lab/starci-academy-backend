/**
 * Orders module — registers entity, service, controller.
 */
import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    OrderEntity,
} from "./entities"
import {
    OrdersService,
} from "./orders.service"
import {
    OrdersController,
} from "./orders.controller"

@Module({
    imports: [
        TypeOrmModule.forFeature([OrderEntity]),
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule {}
