/**
 * Root module — wires ConfigModule and feature modules.
 */
import {
    appConfig,
} from "./config"
/**
 * Root tracing lab module — mounts Checkout only so `/checkout` demonstrates Trace + child spans.
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    CheckoutModule,
} from "./checkout"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),CheckoutModule],
})
/**
 * Class `AppModule` — lesson lab component.
 */
export class AppModule {}
