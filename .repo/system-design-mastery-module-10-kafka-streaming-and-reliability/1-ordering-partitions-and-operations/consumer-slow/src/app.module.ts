/**
 * Module gốc — Kafka ordering lab (partition key + consumer group).
 * (EN: Root module — Kafka ordering lab (partition key + consumer group).)
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
