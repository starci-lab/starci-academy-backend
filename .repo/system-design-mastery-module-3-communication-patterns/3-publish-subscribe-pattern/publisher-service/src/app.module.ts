/**
 * Root module — wires ConfigModule and feature modules.
 */
import {
    appConfig,
} from "./config"
/**
 * Root Publisher module — registers NATS client and REST controller.
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
                // Token inject cho NATS client.
// Injection token for NATS client.
                name: "NATS_SERVICE",
                transport: Transport.NATS,
                options: {
                    servers: [
// NATS server address from env or default.
                        process.env.NATS_URL || "nats://nats:4222",
                    ],
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
