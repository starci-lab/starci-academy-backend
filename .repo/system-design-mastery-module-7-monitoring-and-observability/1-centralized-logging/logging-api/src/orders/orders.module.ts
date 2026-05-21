/**
 * Module đơn hàng — đăng ký controller và service demo log/error.
 * (EN: Orders module — registers controller and service for log/error demos.)
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
 * Class `OrdersModule` — thành phần lab (controller/service/module).
 * (EN: Class `OrdersModule` — lesson lab component.)
 */
export class OrdersModule {}
