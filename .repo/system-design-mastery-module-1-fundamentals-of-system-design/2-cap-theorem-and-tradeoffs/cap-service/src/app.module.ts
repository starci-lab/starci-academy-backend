/**
 * Module gốc — gom ConfigModule và feature modules.
 * (EN: Root module — wires ConfigModule and feature modules.)
 */
import {
    appConfig,
    nodeConfig,
} from "./config"
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    NodeModule,
} from "./node"

/**
 * Module gốc — Quản lý dependencies chung.
 * (EN: Root module — Manages global dependencies.)
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, nodeConfig],
        }),
        // Module Node — xử lý logic CAP
        // (EN: Node module — handles CAP logic)
        NodeModule,
    ],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule { }
