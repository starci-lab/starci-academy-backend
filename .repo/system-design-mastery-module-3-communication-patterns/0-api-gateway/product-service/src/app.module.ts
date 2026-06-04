/**
 * Root module — wires ConfigModule and feature modules.
 */
import {
    appConfig,
} from "./config"
/**
 * Root module — registers controller and service for Product Service.
 */
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

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),],
    controllers: [AppController],
    providers: [AppService],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
