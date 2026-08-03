import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./csrf.module-definition"
import {
    CsrfService
} from "./csrf.service"
import {
    CsrfGuard
} from "./guards"

@Module({
    providers: [
        CsrfService,
        CsrfGuard,
    ],
    exports: [
        CsrfService,
        CsrfGuard,
    ],
})
export class CsrfModule extends ConfigurableModuleClass {}
