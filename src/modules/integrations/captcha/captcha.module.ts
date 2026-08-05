import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./captcha.module-definition"
import {
    CaptchaService
} from "./captcha.service"
import {
    CaptchaGuard,
} from "./guards/captcha.guard"

@Module({
    providers: [
        CaptchaService,
        CaptchaGuard,
    ],
    exports: [
        CaptchaService,
        CaptchaGuard,
    ],
})
/**
 * Exposes {@link CaptchaService} + {@link CaptchaGuard} so mutation endpoints can
 * verify Turnstile without each feature constructing its own siteverify client.
 */
export class CaptchaModule extends ConfigurableModuleClass {}
