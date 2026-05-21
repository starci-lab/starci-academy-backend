/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    RateLimitService,
} from "."

@Module({
    providers: [RateLimitService],
    exports: [RateLimitService],
})
/**
 * Class `RateLimitModule` — thành phần lab (controller/service/module).
 * (EN: Class `RateLimitModule` — lesson lab component.)
 */
export class RateLimitModule {}
