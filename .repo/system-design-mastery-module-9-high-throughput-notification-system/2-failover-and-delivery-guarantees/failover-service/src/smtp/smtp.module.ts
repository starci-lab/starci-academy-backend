/**
 * Nest feature module — đăng ký controller/service/providers.
 * (EN: Nest feature module — registers controllers/services/providers.)
 */
import { Module } from "@nestjs/common"
import { SmtpService } from "."

@Module({
    providers: [SmtpService],
    exports: [SmtpService],
})
/**
 * Class `SmtpModule` — thành phần lab (controller/service/module).
 * (EN: Class `SmtpModule` — lesson lab component.)
 */
export class SmtpModule {}
