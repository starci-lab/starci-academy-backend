import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./refund-course-purchase.module-definition"
import {
    RefundCoursePurchaseResolver,
} from "./refund-course-purchase.resolver"
import {
    RefundCoursePurchaseService,
} from "./refund-course-purchase.service"
import {
    RefundCoursePurchaseHandler,
} from "./refund-course-purchase.handler"

@Module({
    providers: [
        RefundCoursePurchaseResolver,
        RefundCoursePurchaseService,
        RefundCoursePurchaseHandler,
    ],
})
/** Registers the ops-only course refund boundary. */
export class RefundCoursePurchaseSingleMutationModule extends ConfigurableModuleClass {}
