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
export class CheckEmailExistsQueryModule extends ConfigurableModuleClass {}

