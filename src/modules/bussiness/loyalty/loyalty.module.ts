import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./loyalty.module-definition"
import {
    LoyaltyDiscountService,
} from "./loyalty-discount.service"

@Module({
    providers: [
        LoyaltyDiscountService,
    ],
    exports: [
        LoyaltyDiscountService,
    ],
})
/**
 * Loyalty-discount business module: the engagement-based course discount used by
 * the checkout pricing service and the recommended-courses query. Exports
 * {@link LoyaltyDiscountService}. The {@link UserStatsProjectionService} it
 * depends on is provided by the globally-registered projections module.
 */
export class LoyaltyModule extends ConfigurableModuleClass {
}
