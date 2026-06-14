import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    PurchaseMembershipResolver,
} from "./purchase-membership.resolver"
import {
    PurchaseMembershipService,
} from "./purchase-membership.service"
import {
    PurchaseMembershipHandler,
} from "./purchase-membership.handler"
import {
    ConfigurableModuleClass,
} from "./purchase-membership.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        PurchaseMembershipResolver,
        PurchaseMembershipService,
        PurchaseMembershipHandler,
    ],
    exports: [
        PurchaseMembershipService,
    ],
})
export class PurchaseMembershipSingleMutationModule extends ConfigurableModuleClass {}
