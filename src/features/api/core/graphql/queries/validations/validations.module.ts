import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./validations.module-definition"
import {
    CheckEmailExistsQueryModule,
} from "./check-email-exists"

@Module({
    imports: [
        CheckEmailExistsQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class ValidationsModule extends ConfigurableModuleClass {}

