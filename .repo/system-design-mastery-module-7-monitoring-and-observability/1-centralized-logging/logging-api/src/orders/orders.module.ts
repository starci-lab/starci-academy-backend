/**
 * Orders module — registers controller and service for log/error demos.
 */
import {
    Module,
} from "@nestjs/common"
import {
    OrdersController,
} from "."
import {
    OrdersService,
} from "."

@Module({
    controllers: [
        OrdersController,
    ],
    providers: [
        OrdersService,
    ],
})
/**
 * Class `OrdersModule` — lesson lab component.
 */
export class OrdersModule {}
