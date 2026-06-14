import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./revoke-session.module-definition"
import {
    RevokeSessionResolver,
} from "./revoke-session.resolver"

@Module({
    providers: [
        RevokeSessionResolver,
    ],
})
export class RevokeSessionSingleMutationModule extends ConfigurableModuleClass {}
