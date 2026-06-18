import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./contact.module-definition"
import {
    SubmitContactSingleMutationModule,
} from "./submit-contact"

/**
 * Public contact mutation group (the contact-form submission).
 */
@Module({
    imports: [
        SubmitContactSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class ContactMutationsModule extends ConfigurableModuleClass {}
