import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./contact.module-definition"
import {
    SubmitContactSingleMutationModule,
} from "./submit-contact"

@Module({
    imports: [
        SubmitContactSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Public contact mutation group (the contact-form submission).
 */
export class ContactMutationsModule extends ConfigurableModuleClass {}
