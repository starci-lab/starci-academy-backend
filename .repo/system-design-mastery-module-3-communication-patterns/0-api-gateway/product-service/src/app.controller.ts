/**
 * Product Service controller — exposes POST /products and GET /products.
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
    CreateProductInput,
    Product,
} from "./app.service"

@Controller("products")
/**
 * Class `AppController` — routes delegate to `AppService`.
 */
export class AppController {
    constructor(private readonly appService: AppService) {}

    /**
     * Logic — Create a product from the request body (HTTP 201 by Nest default).
     * Code — Delegate to `appService.create`.
     */
    @Post()
    create(@Body() body: CreateProductInput): Product {
        return this.appService.create(body)
    }

    /**
     * Logic — Return the product list.
     * Code — Delegate to `appService.list`.
     */
    @Get()
    list(): Product[] {
        return this.appService.list()
    }
}
