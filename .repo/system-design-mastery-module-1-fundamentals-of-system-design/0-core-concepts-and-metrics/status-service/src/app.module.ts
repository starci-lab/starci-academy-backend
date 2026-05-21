/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
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

/**
 * Module gốc — Quản lý dependencies chung.
 * (EN: Root module — Manages global dependencies.)
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
        // Module trạng thái — xử lý API Node
        // (EN: Status module — handles API Node)
        StatusModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
