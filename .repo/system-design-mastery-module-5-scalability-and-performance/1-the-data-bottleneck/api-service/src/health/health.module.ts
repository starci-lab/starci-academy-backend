/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from "@nestjs/common"
import { TerminusModule } from "@nestjs/terminus"
import { TypeOrmModule } from "@nestjs/typeorm"
import { HealthController } from "."

/**
 * Module health check — Terminus + TypeORM ping probe lên Postgres primary.
 * (EN: Health check module — Terminus + TypeORM ping probe against Postgres primary.)
 */
@Module({
    imports: [TerminusModule, TypeOrmModule],
    controllers: [HealthController],
})
/**
 * Class `HealthModule` — thành phần lab (controller/service/module).
 * (EN: Class `HealthModule` — lesson lab component.)
 */
export class HealthModule {}

