import {
    Module,
} from "@nestjs/common"
import {
    UseFormModule,
} from "./0-useform-and-zod-resolver"
import {
    AsyncValidationModule,
} from "./1-async-validation-with-debounce"
import {
    WizardModule,
} from "./2-multi-step-wizard-form"
import {
    DynamicFieldsModule,
} from "./3-dynamic-fields-with-usefieldarray"

/** Aggregator module bundling every leaf mock for the form-mastery module. */
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
export class FormMasteryMockModule {}
