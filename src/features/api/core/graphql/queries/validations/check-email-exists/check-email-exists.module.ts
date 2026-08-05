import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./check-email-exists.module-definition"
import {
    CheckEmailExistsResolver,
} from "./check-email-exists.resolver"
import {
    CheckEmailExistsService,
} from "./check-email-exists.service"
import {
    CheckEmailExistsHandler,
} from "./check-email-exists.handler"

@Module({
    providers: [
        CheckEmailExistsService,
        CheckEmailExistsResolver,
        CheckEmailExistsHandler,
    ],
})
/**
 * Wires the public `checkEmailExists` bloom-filter probe (no auth). Used
 * on signup before a slower authoritative uniqueness check.
 */
export class CheckEmailExistsSingleQueryModule extends ConfigurableModuleClass {}

