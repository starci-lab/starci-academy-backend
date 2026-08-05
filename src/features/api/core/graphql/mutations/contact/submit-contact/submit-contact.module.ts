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
/**
 * Registers the public contact-form write so spam throttle + persistence
 * stay a single Nest unit under the contact aggregator.
 */
export class SubmitContactSingleMutationModule extends ConfigurableModuleClass {}
