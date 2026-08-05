import {
    CourseEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CourseNotFoundException,
} from "@modules/exceptions"
import {
    LoyaltyDiscountService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import {
    In,
    type EntityManager,
} from "typeorm"
import {
    CoursePricingService,
} from "../course-enroll/course-pricing.service"
import type {
    CartPricedLine,
    PriceCartParams,
    PriceCartResult,
} from "./types"

@Injectable()
/**
 * Prices a multi-course cart into per-course lines + order totals, shared by the
 * checkout handler (charge + persist) and the checkout-preview query (display), so
 * the price shown in the cart is exactly the price charged at checkout.
 *
 * Pricing rules:
 * - **Progressive loyalty**: line `index` is priced as if the `index` earlier lines
 *   of the SAME order were already owned, so buying a cart is never worse than
 *   checking the same courses out one at a time.
 * - **Bundle bonus**: a flat order-wide bonus (+5% for 2 courses, +10% for 3+) is
 *   added on top of each line's loyalty percent, capped at the combined ceiling.
 */
export class CoursesCheckoutPricingService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly coursePricingService: CoursePricingService,
        private readonly loyaltyDiscountService: LoyaltyDiscountService,
    ) {}

    /**
     * Price the requested courses for a buyer.
     *
     * De-duplicates the ids, verifies every id resolves to a course (throws
     * {@link CourseNotFoundException} on a missing id), drops courses the buyer
     * already owns (paid enrollment), then prices the remainder with progressive
     * loyalty + the order bundle bonus. Returns empty `lines` when nothing is
     * purchasable (empty request or all already owned) — the caller decides whether
     * that is an error (checkout) or an empty preview.
     *
     * @param params - The buyer id + the requested course ids.
     * @returns The priced lines + summed order totals + bundle context.
     */
    async priceCart(
        {
            userId,
            courseIds,
        }: PriceCartParams,
    ): Promise<PriceCartResult> {
        // de-duplicate the requested ids (a course cannot be bought twice per order)
        const uniqueCourseIds = Array.from(new Set(courseIds))
        // nothing requested → empty result (caller decides if that is an error)
        if (uniqueCourseIds.length === 0) {
            return this.emptyResult()
        }

        // load every requested course WITH pricing phases + metadata so the pricing
        // service can resolve the active-tier price and current phase per course
        const courses = await this.entityManager.find(
            CourseEntity,
            {
                where: {
                    id: In(uniqueCourseIds),
                },
                relations: {
                    metadata: true,
                    pricingPhases: true,
                },
            },
        )
        // a requested id that did not resolve is bad data → surface the first missing
        if (courses.length !== uniqueCourseIds.length) {
            const foundIds = new Set(courses.map((course) => course.id))
            const missingId = uniqueCourseIds.find((courseId) => !foundIds.has(courseId))
            throw new CourseNotFoundException({
                id: missingId ?? uniqueCourseIds[0],
            })
        }

        // drop courses the buyer already OWNS (paid enrollment) — re-buying is a
        // no-op the enroll step would skip. Trial rows (is_enrolled=false) are NOT
        // ownership, so those courses are still purchasable.
        const paidEnrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    course: {
                        id: In(uniqueCourseIds),
                    },
                    isEnrolled: true,
                },
            },
        )
        const ownedCourseIds = new Set(
            paidEnrollments.map((enrollment) => enrollment.courseId),
        )
        // only the not-yet-owned courses remain purchasable in this order
        const purchasableCourses = courses.filter(
            (course) => !ownedCourseIds.has(course.id),
        )
        // nothing left to buy → empty result (caller decides if that is an error)
        if (purchasableCourses.length === 0) {
            return this.emptyResult()
        }

        // the order-wide bundle bonus is a function of the purchasable count only
        const bundleBonusPercent = this.loyaltyDiscountService
            .computeBundleBonusPercent(purchasableCourses.length)
        // fetch the user's loyalty inputs ONCE — owned-count + diligence are identical
        // for every line; only the progressive `extraOwnedCount` varies (pure arithmetic),
        // so this avoids N per-line DB round-trips for an N-course cart.
        const loyaltyContext = await this.loyaltyDiscountService.computeLoyaltyContext(userId)

        // price each purchasable course into a line (list + charged, VND + USD).
        // pure per line now (no DB), so a plain synchronous map.
        const lines: Array<CartPricedLine> = purchasableCourses.map((course, index) => {
            // base engagement loyalty, pretending `index` earlier lines are owned
            const {
                percent: basePercent,
            } = this.loyaltyDiscountService.resolveLoyaltyPercent({
                context: loyaltyContext,
                extraOwnedCount: index,
            })
            // add the order-wide bundle bonus, capped at the combined ceiling
            const discountPercent = this.loyaltyDiscountService.applyBundleBonus({
                basePercent,
                itemCount: purchasableCourses.length,
            })
            return {
                course,
                // struck "before" prices (list / MSRP), no discount applied
                listVnd: this.coursePricingService.resolveListAmountVnd({
                    course,
                }),
                listUsd: this.coursePricingService.resolveListAmountUsd({
                    course,
                }),
                // charged prices with loyalty + bundle applied
                chargedVnd: this.coursePricingService.resolveAmountVnd({
                    course,
                    discountPercent,
                }),
                chargedUsd: this.coursePricingService.resolveAmountUsd({
                    course,
                    discountPercent,
                }),
                discountPercent,
                pricingPhase: this.coursePricingService.getCurrentPricingPhase(course),
            }
        })

        // domestic total = sum of every line's charged VND
        const totalChargedVnd = lines.reduce(
            (acc, line) => acc + line.chargedVnd,
            0,
        )
        // struck total = sum of every line's list VND
        const totalListVnd = lines.reduce(
            (acc, line) => acc + line.listVnd,
            0,
        )
        // USD totals are only meaningful when EVERY line has a USD price — a mixed
        // cart (one course lacks USD) cannot be paid internationally at all
        const everyLineHasChargedUsd = lines.every((line) => line.chargedUsd != null)
        const everyLineHasListUsd = lines.every((line) => line.listUsd != null)
        const totalChargedUsd = everyLineHasChargedUsd
            ? lines.reduce(
                (acc, line) => acc + (line.chargedUsd ?? 0),
                0,
            )
            : null
        const totalListUsd = everyLineHasListUsd
            ? lines.reduce(
                (acc, line) => acc + (line.listUsd ?? 0),
                0,
            )
            : null

        return {
            lines,
            totalListVnd,
            totalChargedVnd,
            totalListUsd,
            totalChargedUsd,
            bundleBonusPercent,
            itemCount: lines.length,
        }
    }

    /**
     * The zero-value result returned when a cart has nothing purchasable.
     *
     * @returns An empty priced-cart result.
     */
    private emptyResult(): PriceCartResult {
        return {
            lines: [],
            totalListVnd: 0,
            totalChargedVnd: 0,
            totalListUsd: null,
            totalChargedUsd: null,
            bundleBonusPercent: 0,
            itemCount: 0,
        }
    }
}
