/**
 * Root module — wires ConfigModule and feature modules.
 */
import {
    appConfig,
} from "./config"
/**
 * Root Order module — registers Kafka producer client and REST controller.
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    ClientsModule,
    Transport,
} from "@nestjs/microservices"
import {
    AppController,
} from "./app.controller"
import {
    AppService,
} from "./app.service"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
        ClientsModule.register([
            {
                // Token inject cho Kafka producer client.
// Injection token for Kafka producer client.
                name: "KAFKA_SERVICE",
                transport: Transport.KAFKA,
                options: {
                    client: {
// Kafka broker address from env or default.
                        brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
                    },
                    producer: {
// Auto-create topic if not exists (dev only).
                        allowAutoTopicCreation: true,
                    },
                },
            },
        ]),
    ],
    controllers: [AppController],
    providers: [AppService],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
