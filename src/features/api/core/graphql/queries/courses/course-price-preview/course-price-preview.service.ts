import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    nextPricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    LoyaltyDiscountService,
} from "@modules/bussiness/loyalty/loyalty-discount.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    CoursePricingService,
} from "../../../mutations/courses/course-enroll/course-pricing.service"
import type {
    CoursePricePreviewData,
} from "./graphql-types/response"

/** Params for previewing a course's pre-checkout price for a viewer. */
export interface PreviewCoursePriceParams {
    /** The viewer to price for (loyalty discount is per-user). */
    userId: string
    /** The course to price. */
    courseId: string
    /** An optional Coin-shop voucher code to preview ON TOP of the loyalty discount. */
    voucherCode?: string
}

@Injectable()
/**
 * Prices a single course for the payment modal exactly as it would be charged at
 * checkout: the active pricing phase resolved by {@link CoursePricingService} with
 * the viewer's {@link LoyaltyDiscountService} discount applied -- so the shown price
 * equals the eventual charge (no FE price guessing). Optionally previews a
 * Coin-shop voucher code ON TOP (read-only -- {@link VoucherService.previewDiscount}
 * validates but does not reserve/consume the code).
 */
export class CoursePricePreviewService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly coursePricingService: CoursePricingService,
        private readonly loyaltyDiscountService: LoyaltyDiscountService,
        private readonly voucherService: VoucherService,
        private readonly installmentPlanService: InstallmentPlanService,
    ) {}

    /**
     * Resolve the original + loyalty-discounted price (VND always, USD when set)
     * for a course and viewer, plus the further voucher-discounted price when a
     * valid `voucherCode` is given.
     *
     * @param params - {@link PreviewCoursePriceParams}
     * @returns The course's price preview.
     */
    async preview(
        {
            userId,
            courseId,
            voucherCode,
        }: PreviewCoursePriceParams,
    ): Promise<CoursePricePreviewData> {
        // load the course with the relations the pricing service needs
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: courseId,
                },
                relations: {
                    metadata: true,
                    pricingPhases: true,
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException({
                id: courseId,
            })
        }

        // one loyalty computation for the viewer (same percent prices the course)
        const {
            percent,
            reason,
            enrolledCount,
        } = await this.loyaltyDiscountService.computeLoyaltyDiscount({
            userId,
        })

        // original = LIST/MSRP price (struck "before"); discounted = active phase x
        // (1 − loyalty) = the real charge. The gap therefore shows the FULL saving
        // (phase tier discount + loyalty), not loyalty alone -- so a Pioneer/Early-bird
        // tier surfaces even when the viewer has no loyalty discount.
        const originalPriceVnd = this.coursePricingService.resolveListAmountVnd({
            course,
        })
        // phase price = active tier BEFORE loyalty (the middle step list -> phase -> charge)
        const phasePriceVnd = this.coursePricingService.resolveAmountVnd({
            course,
        })
        const discountedPriceVnd = this.coursePricingService.resolveAmountVnd({
            course,
            discountPercent: percent,
        })
        const originalPriceUsd = this.coursePricingService.resolveListAmountUsd({
            course,
        })
        const phasePriceUsd = this.coursePricingService.resolveAmountUsd({
            course,
        })
        const discountedPriceUsd = this.coursePricingService.resolveAmountUsd({
            course,
            discountPercent: percent,
        })

        // voucher preview is OPTIONAL and read-only -- an invalid code throws
        // (surfaces as a GraphQL error the FE shows inline), a valid one further
        // discounts the ALREADY loyalty-discounted VND price
        let voucherDiscountedPriceVnd: number | null = null
        if (voucherCode) {
            const preview = await this.voucherService.previewDiscount({
                userId,
                code: voucherCode,
                courseId,
            })
            voucherDiscountedPriceVnd = this.voucherService.applyToAmount(
                discountedPriceVnd,
                preview,
            )
        }

        // Pricing-phase SCARCITY (real numbers only -- never a fabricated countdown):
        // how many seats remain at the CURRENT phase price (seat cap − PAID enrollments)
        // and what a buyer pays once it sells out (the next tier's price). Powers an
        // honest Pioneer N/M urgency line urgency line on the paywall.
        const currentPhase = this.coursePricingService.getCurrentPricingPhase(course)
        const nextPhase = nextPricingPhase(currentPhase)
        const hasNextPhase = nextPhase !== currentPhase
        const currentPhaseRow = course.pricingPhases.find(
            (pricingPhase) => pricingPhase.phase === currentPhase,
        )
        const slotAvailable = currentPhaseRow?.slotAvailable ?? null
        const seatsTaken = await this.entityManager.count(
            EnrollmentEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                    isEnrolled: true,
                },
            },
        )
        const seatsRemainingInCurrentPhase = slotAvailable != null
            ? Math.max(0,
                slotAvailable - seatsTaken)
            : null
        // next-tier price (before loyalty -- comparable to `phasePriceVnd`). VND can throw
        // when a tier has no configured price -> fall back to null so scarcity just hides
        // the number rather than breaking the whole preview.
        let nextPhasePriceVnd: number | null = null
        if (hasNextPhase) {
            try {
                nextPhasePriceVnd = this.coursePricingService.resolveAmountVnd({
                    course,
                    phase: nextPhase,
                })
            } catch {
                nextPhasePriceVnd = null
            }
        }
        const nextPhasePriceUsd = hasNextPhase
            ? this.coursePricingService.resolveAmountUsd({
                course,
                phase: nextPhase,
            })
            : null

        // installment terms priced off the ACTUAL VND charge base (voucher beats
        // loyalty when present) so the modal's "X/month" equals the eventual charge
        const installmentBaseVnd = voucherDiscountedPriceVnd ?? discountedPriceVnd
        const installmentOptions = this.installmentPlanService.computeInstallmentOptions(installmentBaseVnd)

        return {
            originalPriceVnd,
            phasePriceVnd,
            discountedPriceVnd,
            discountPercent: percent,
            originalPriceUsd,
            phasePriceUsd,
            discountedPriceUsd,
            discountReason: reason,
            enrolledCount,
            voucherDiscountedPriceVnd,
            currentPhase,
            nextPhase: hasNextPhase ? nextPhase : null,
            seatsRemainingInCurrentPhase,
            nextPhasePriceVnd,
            nextPhasePriceUsd,
            installmentOptions,
        }
    }
}
