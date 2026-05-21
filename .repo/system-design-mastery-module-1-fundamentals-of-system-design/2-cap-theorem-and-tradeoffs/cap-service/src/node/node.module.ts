/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    HttpModule,
} from "@nestjs/axios"
import {
    NodeController,
} from "."
import {
    NodeService,
} from "."

/**
 * Module xử lý node trong cụm.
 * (EN: Node processing module in cluster.)
 */
@Module({
    imports: [HttpModule],
    controllers: [NodeController],
    providers: [NodeService],
})
/**
 * Class `NodeModule` — thành phần lab (controller/service/module).
 * (EN: Class `NodeModule` — lesson lab component.)
 */
export class NodeModule {}
