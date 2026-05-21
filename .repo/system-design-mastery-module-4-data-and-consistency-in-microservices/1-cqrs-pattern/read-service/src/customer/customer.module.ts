/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from '@nestjs/common';
import { CustomerController } from '.';
import { CustomerProfileRmqController } from '.';
import { ElasticsearchService } from '.';

@Module({
  controllers: [CustomerController, CustomerProfileRmqController],
  providers: [ElasticsearchService],
})
/**
 * Class `CustomerModule` — thành phần lab (controller/service/module).
 * (EN: Class `CustomerModule` — lesson lab component.)
 */
export class CustomerModule {}
