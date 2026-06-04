/**
 * Root module — ConfigModule + Kafka producer via ConfigService.
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import {
    ClientsModule,
    Transport,
} from "@nestjs/microservices"
import {
    appConfig,
    kafkaConfig,
    type KafkaConfig,
} from "./config"
import {
    EventsController,
} from "./events"
import {
    EventsService,
} from "./events"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, kafkaConfig],
        }),
        ClientsModule.registerAsync({
            clients: [
                {
                    name: "KAFKA_PRODUCER",
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (config: ConfigService) => {
                        const kafka = config.getOrThrow<KafkaConfig>("kafka")
                        return {
                            transport: Transport.KAFKA,
                            options: {
                                client: {
                                    clientId: kafka.clientId,
                                    brokers: kafka.brokers,
                                },
                                producer: {
                                    allowAutoTopicCreation: true,
                                },
                            },
                        }
                    },
                },
            ],
        }),
    ],
    controllers: [EventsController],
    providers: [EventsService],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
