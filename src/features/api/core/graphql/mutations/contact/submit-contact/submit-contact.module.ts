import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submit-contact.module-definition"
import {
    SubmitContactResolver,
} from "./submit-contact.resolver"

@Module({
    providers: [
        SubmitContactResolver,
    ],
})
export class SubmitContactSingleMutationModule extends ConfigurableModuleClass {}
