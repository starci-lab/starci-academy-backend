import {
    Module,
} from "@nestjs/common"
import {
    PurchaseMembershipSingleMutationModule,
} from "./purchase-membership"
import {
    ConfigurableModuleClass,
} from "./membership.module-definition"

/**
 * Community membership mutation group (purchase / checkout).
 */
@Module({
    imports: [
        PurchaseMembershipSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class MembershipMutationsModule extends ConfigurableModuleClass { }
