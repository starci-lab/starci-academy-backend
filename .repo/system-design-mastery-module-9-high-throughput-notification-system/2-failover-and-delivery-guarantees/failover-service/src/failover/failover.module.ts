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
    FailoverEntity,
} from "."
import {
    FailoverService,
} from "."
import {
    FailoverController,
} from "."

/**
 * Feature Module quản lý bài học Failover and Delivery Guarantees.
 * (EN: Feature Module managing lesson Failover and Delivery Guarantees.)
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([FailoverEntity]),
    ],
    controllers: [FailoverController],
    providers: [FailoverService],
    exports: [FailoverService],
})
/**
 * Class `FailoverModule` — thành phần lab (controller/service/module).
 * (EN: Class `FailoverModule` — lesson lab component.)
 */
export class FailoverModule {}
