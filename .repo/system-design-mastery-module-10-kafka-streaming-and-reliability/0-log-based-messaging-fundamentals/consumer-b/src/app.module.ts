/**
 * Module gốc — ConfigModule + Kafka producer/consumer wiring cho lesson log fundamentals.
 * (EN: Root module — ConfigModule + Kafka producer/consumer wiring for log fundamentals lesson.)
 */
import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import {
    appConfig,
    kafkaConfig,
} from "./config"
import { ConsumerController } from "./consumer"
import { ConsumerService } from "./consumer"

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true, load: [appConfig, kafkaConfig] })],
    controllers: [ConsumerController],
    providers: [ConsumerService],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
