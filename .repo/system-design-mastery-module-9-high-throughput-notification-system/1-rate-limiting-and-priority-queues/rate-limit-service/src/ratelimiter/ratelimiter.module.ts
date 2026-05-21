/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    RatelimiterEntity,
} from "."
import {
    RatelimiterService,
} from "."
import {
    RatelimiterController,
} from "."

/**
 * Feature Module quản lý bài học Rate Limiting and Priority Queues.
 * (EN: Feature Module managing lesson Rate Limiting and Priority Queues.)
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([RatelimiterEntity]),
    ],
    controllers: [RatelimiterController],
    providers: [RatelimiterService],
    exports: [RatelimiterService],
})
/**
 * Class `RatelimiterModule` — thành phần lab (controller/service/module).
 * (EN: Class `RatelimiterModule` — lesson lab component.)
 */
export class RatelimiterModule {}
