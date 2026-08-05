import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./authentication.module-definition"
import {
    MeSingleQueryModule,
} from "./me/me.module"

@Module({
    imports: [
        MeSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Auth-facing query group. Today only `me` -- the identity snapshot the
 * signed-in shell boots from. Login / logout / refresh are mutations.
 */
export class AuthenticationQueriesModule extends ConfigurableModuleClass {}
