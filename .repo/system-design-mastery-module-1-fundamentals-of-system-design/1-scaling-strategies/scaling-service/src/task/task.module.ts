/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    TaskController,
} from "."
import {
    TaskService,
} from "."

/**
 * Module xử lý tác vụ.
 * (EN: Task processing module.)
 */
@Module({
    controllers: [TaskController],
    providers: [TaskService],
})
/**
 * Class `TaskModule` — thành phần lab (controller/service/module).
 * (EN: Class `TaskModule` — lesson lab component.)
 */
export class TaskModule {}
