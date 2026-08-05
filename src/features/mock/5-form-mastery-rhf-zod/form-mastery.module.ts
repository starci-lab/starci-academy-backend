import {
    Module,
} from "@nestjs/common"
import {
    UseFormModule,
} from "./0-useform-and-zod-resolver/useform.module"
import {
    AsyncValidationModule,
} from "./1-async-validation-with-debounce/async-validation.module"
import {
    WizardModule,
} from "./2-multi-step-wizard-form/wizard.module"
import {
    DynamicFieldsModule,
} from "./3-dynamic-fields-with-usefieldarray/dynamic-fields.module"

@Module({
    imports: [
        UseFormModule.register({
            isGlobal: true,
        }),
        AsyncValidationModule.register({
            isGlobal: true,
        }),
        WizardModule.register({
            isGlobal: true,
        }),
        DynamicFieldsModule.register({
            isGlobal: true,
        }),
    ],
})
/** Aggregator module bundling every leaf mock for the form-mastery module. */
export class FormMasteryMockModule {}
