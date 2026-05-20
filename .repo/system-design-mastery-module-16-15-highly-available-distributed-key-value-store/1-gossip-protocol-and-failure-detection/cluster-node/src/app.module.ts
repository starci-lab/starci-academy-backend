import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    appConfig,
} from "./config"
import {
    GossipModule,
} from "./gossip"

/**
 * Module gốc nạp ConfigModule và feature module của bài học.
 * (EN: Root module loading ConfigModule and the lesson feature module.)
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ".env",
            isGlobal: true,
            load: [
                appConfig,
            ],
        }),
        GossipModule,
    ],
})
export class AppModule {}
