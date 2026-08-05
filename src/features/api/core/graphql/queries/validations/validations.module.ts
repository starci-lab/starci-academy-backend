import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./validations.module-definition"
import {
    CheckEmailExistsSingleQueryModule,
} from "./check-email-exists"

@Module({
    imports: [
        CheckEmailExistsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Public pre-auth validation helpers. Currently just `checkEmailExists`
 * (bloom filter, not a DB lookup) for signup / email fields.
 */
export class ValidationsModule extends ConfigurableModuleClass {}

