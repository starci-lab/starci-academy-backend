/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
} from "./config"
/**
 * Module gốc — đăng ký BankController cho dịch vụ ngân hàng giả lập.
 * (EN: Root module — registers BankController for simulated bank service.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    BankController,
} from "./bank.controller"

@Module({
    controllers: [BankController],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
