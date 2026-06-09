/**
 * Order Service controller — exposes POST /orders and GET /orders.
 * The service does not know it sits behind a gateway; it serves plain HTTP.
 */
import {
    Body,
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    AppService,
    CreateOrderInput,
    Order,
} from "./app.service"

@Controller("orders")
/**
 * Class `AppController` — routes delegate to `AppService`.
 */
export class AppController {
    constructor(private readonly appService: AppService) {}

    /**
     * Logic — Create an order from the request body (HTTP 201 by Nest default).
     * Code — Delegate to `appService.create`.
     */
    @Post()
    create(@Body() body: CreateOrderInput): Order {
        return this.appService.create(body)
    }

    /**
     * Logic — Return the order list.
     * Code — Delegate to `appService.list`.
     */
    @Get()
    list(): Order[] {
        return this.appService.list()
    }
}
