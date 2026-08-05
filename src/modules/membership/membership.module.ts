import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./membership.module-definition"
import {
    MembershipService,
} from "./membership.service"

@Module({
    providers: [
        MembershipService,
    ],
    exports: [
        MembershipService,
    ],
})
/**
 * Community-membership grant/extend/expiry for paywalls. Isolated so payment
 * webhooks can import entitlement without pulling the whole billing graph.
 */
export class MembershipModule extends ConfigurableModuleClass {}
