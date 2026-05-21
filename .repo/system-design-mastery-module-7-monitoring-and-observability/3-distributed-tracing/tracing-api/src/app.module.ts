/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
} from "./config"
/**
 * Module gốc lab tracing — chỉ mount Checkout để một luồng `/checkout` minh hoạ Trace + Span con.
 * (EN: Root tracing lab module — mounts Checkout only so `/checkout` demonstrates Trace + child spans.)
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
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
