/**
 * Root module — registers controller calling Consul Agent HTTP API.
 */
import {
    Module 
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    appConfig,
    consulConfig,
} from "./config"
import {
    ConsulController 
} from "./consul.controller"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                appConfig,
                consulConfig,
            ],
        }),
    ],
    controllers: [
        ConsulController,
    ],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
