/**
 * Root module — Kafka ordering lab (partition key + consumer group).
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
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
