import {
    Module,
} from "@nestjs/common"
import {
    PurchaseMembershipSingleMutationModule,
} from "./purchase-membership"
import {
    ConfigurableModuleClass,
} from "./membership.module-definition"

@Module({
    imports: [
        PurchaseMembershipSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Community membership mutation group (purchase / checkout).
 */
export class MembershipMutationsModule extends ConfigurableModuleClass { }
