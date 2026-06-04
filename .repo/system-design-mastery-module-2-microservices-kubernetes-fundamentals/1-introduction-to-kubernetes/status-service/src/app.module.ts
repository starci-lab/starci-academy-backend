/**
 * Root module — wires ConfigModule and feature modules.
 */
import {
    appConfig,
} from "./config"
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    StatusModule,
} from "./status"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
        // status endpoint module
        StatusModule,
    ],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
