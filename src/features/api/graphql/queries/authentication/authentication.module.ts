import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./authentication.module-definition"
import {
    MeSingleQueryModule,
} from "./me"

@Module({
    imports: [
        MeSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class AuthenticationQueriesModule extends ConfigurableModuleClass {}
