/**
 * Root module — wires ConfigModule and feature modules.
 */
import {
    appConfig,
    databaseConfig,
    redisConfig,
} from "./config"
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    AppController,
} from "./app.controller"
import {
    AppService,
} from "./app.service"

/**
 * Root module — K8s Cache-Aside backend demo.
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, redisConfig],
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
