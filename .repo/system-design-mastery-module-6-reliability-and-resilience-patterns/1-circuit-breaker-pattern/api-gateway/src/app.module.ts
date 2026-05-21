/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    Module 
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    appConfig,
    circuitBreakerConfig,
    inventoryConfig,
} from "./config"
import {
    GatewayController 
} from "./gateway.controller"
import {
    GatewayService 
} from "./gateway.service"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                appConfig,
                inventoryConfig,
                circuitBreakerConfig,
            ],
        }),
    ],
    controllers: [GatewayController],
    providers: [GatewayService],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
