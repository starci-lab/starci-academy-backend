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
    CsrfGuard,
} from "./guards/csrf.guard"

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
/**
 * Exports CsrfService + CsrfGuard so mutating HTTP routes can reject requests missing a
 * valid double-submit token.
 */
export class CsrfModule extends ConfigurableModuleClass {}
