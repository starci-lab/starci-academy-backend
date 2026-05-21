/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import { Module } from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    appConfig,
    bulkheadConfig,
} from "./config"
import { EcommerceController } from "./ecommerce.controller"
import { EcommerceService } from "./ecommerce.service"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                appConfig,
                bulkheadConfig,
            ],
        }),
    ],
    controllers: [EcommerceController],
    providers: [EcommerceService],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
