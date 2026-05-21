/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
} from "./config"
/**
 * Module gốc — đăng ký controller và service cho client thanh toán.
 * (EN: Root module — registers controller and service for payment client.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    ClientController,
} from "./client.controller"
import {
    ClientService,
} from "./client.service"

@Module({
    controllers: [ClientController],
    providers: [ClientService],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
