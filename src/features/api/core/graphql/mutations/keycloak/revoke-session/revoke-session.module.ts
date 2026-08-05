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
/** Wires device-session revoke as its own mutation — no CQRS, just SessionService. */
export class RevokeSessionSingleMutationModule extends ConfigurableModuleClass {}
