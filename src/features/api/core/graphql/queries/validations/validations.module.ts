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
export class ValidationsModule extends ConfigurableModuleClass {}

