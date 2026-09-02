import {
    Module,
} from "@nestjs/common"
import {
    ProSubscriptionService,
} from "./pro-subscription.service"
import {
    EffectiveLearnerAccessService,
} from "./effective-learner-access.service"

@Module({
    providers: [
        ProSubscriptionService,
        EffectiveLearnerAccessService,
    ],
    exports: [
        ProSubscriptionService,
        EffectiveLearnerAccessService,
    ],
})
/** Publishes the dedicated Pro lifecycle and read-only access composer. */
export class ProSubscriptionModule {}
