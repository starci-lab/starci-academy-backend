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
    CaptchaGuard
} from "./guards"

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
export class CaptchaModule extends ConfigurableModuleClass {}
