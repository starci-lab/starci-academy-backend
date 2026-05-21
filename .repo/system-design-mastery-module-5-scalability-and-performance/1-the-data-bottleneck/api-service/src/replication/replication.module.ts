/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from "@nestjs/common"
import { ReplicationController } from "."

/**
 * Module debug replication — expose endpoint so sánh pg_is_in_recovery trên master vs replica.
 * (EN: Replication debug module — exposes endpoint comparing pg_is_in_recovery on master vs replica.)
 */
@Module({
    controllers: [ReplicationController],
})
/**
 * Class `ReplicationModule` — thành phần lab (controller/service/module).
 * (EN: Class `ReplicationModule` — lesson lab component.)
 */
export class ReplicationModule {}
