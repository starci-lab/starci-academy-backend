/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from '.';

/**
 * Health probe tập trung qua Terminus (EN: health probes via Terminus — https://docs.nestjs.com/recipes/terminus).
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
/**
 * Class `HealthModule` — thành phần lab (controller/service/module).
 * (EN: Class `HealthModule` — lesson lab component.)
 */
export class HealthModule {}
