/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ProcessController,
} from "."
import {
    ProcessService,
} from "."

/**
 * Module xử lý process.
 * (EN: Process module.)
 */
@Module({
    controllers: [ProcessController],
    providers: [ProcessService],
})
/**
 * Class `ProcessModule` — thành phần lab (controller/service/module).
 * (EN: Class `ProcessModule` — lesson lab component.)
 */
export class ProcessModule {}
