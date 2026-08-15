import {
    Injectable,
} from "@nestjs/common"
import {
    In,
    type EntityManager,
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
    VoucherDiscountType,
} from "@modules/databases/postgresql/primary/enums/voucher-discount-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    InvalidVoucherException,
} from "@modules/platform/exceptions/errors/vouchers/invalid-voucher"
import {
    InstallmentPlanService,
} from "../installment-plan/installment-plan.service"
import {
    LoyaltyDiscountService,
} from "../loyalty/loyalty-discount.service"
import {
    VoucherService,
} from "../rewards/voucher.service"
import {
    CoursePriceCalculatorService,
} from "./course-price-calculator.service"
import {
    CoursePriceQuoteIntent,
    type CoursePriceQuoteLine,
    type CoursePriceQuoteResult,
    type QuoteCoursePricesParams,
} from "./types"

@Injectable()
/** Canonical server-side quote engine for discovery and checkout course prices. */
export class CoursePriceQuoteService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly calculator: CoursePriceCalculatorService,
        private readonly loyalty: LoyaltyDiscountService,
        private readonly vouchers: VoucherService,
        private readonly installments: InstallmentPlanService,
    ) {}

    /** Price one or many courses without allowing callers to duplicate arithmetic. */
    async quote(
        {
            userId,
            courseIds,
            intent,
            voucherCode,
            installmentMonths,
        }: QuoteCoursePricesParams,
    ): Promise<CoursePriceQuoteResult> {
        const uniqueIds = Array.from(new Set(courseIds))
        if (uniqueIds.length === 0) {
            return this.emptyResult()
        }
        const loaded = await this.entityManager.find(CourseEntity,
            {
                where: {
                    id: In(uniqueIds),
                },
                relations: {
                    metadata: true,
                    pricingPhases: true,
                },
            })
        const byId = new Map(loaded.map((course) => [course.id,
            course]))
        const missingId = uniqueIds.find((id) => !byId.has(id))
        if (missingId) {
            throw new CourseNotFoundException({
                id: missingId,
            })
        }
        let courses = uniqueIds.map((id) => byId.get(id) as CourseEntity)
        if (intent === CoursePriceQuoteIntent.Checkout) {
            courses = await this.excludeOwnedCourses(userId,
                courses)
        }
        if (courses.length === 0) {
            return this.emptyResult()
        }

        const loyaltyContext = await this.loyalty.computeLoyaltyContext(userId)
        const bundleDiscountPercent = intent === CoursePriceQuoteIntent.Checkout
            ? this.loyalty.computeBundleBonusPercent(courses.length)
            : 0
        const lines = await Promise.all(courses.map(async (course, index) => {
            const loyaltyResult = this.loyalty.resolveLoyaltyPercent({
                context: loyaltyContext,
                extraOwnedCount: intent === CoursePriceQuoteIntent.Checkout ? index : 0,
            })
            const displayDiscountPercent = intent === CoursePriceQuoteIntent.Checkout
                ? this.loyalty.applyBundleBonus({
                    basePercent: loyaltyResult.percent,
                    itemCount: courses.length,
                })
                : loyaltyResult.percent
            return this.priceLine({
                course,
                intent,
                loyaltyDiscountPercent: loyaltyResult.percent,
                bundleDiscountPercent,
                displayDiscountPercent,
                discountReason: loyaltyResult.reason,
                enrolledCount: loyaltyResult.enrolledCount,
            })
        }))

        let voucherDiscountedPriceVnd: number | null = null
        let voucherDiscountedPriceUsd: number | null = null
        if (voucherCode) {
            if (lines.length !== 1) {
                throw new InvalidVoucherException({
                    reason: "wrongCourse",
                })
            }
            const preview = await this.vouchers.previewDiscount({
                userId,
                code: voucherCode,
                courseId: lines[0].course.id,
            })
            voucherDiscountedPriceVnd = this.vouchers.applyToAmount(
                lines[0].chargedVnd,
                preview,
            )
            if (preview.discountType === VoucherDiscountType.Percent && lines[0].chargedUsd != null) {
                voucherDiscountedPriceUsd = this.vouchers.applyToAmount(
                    lines[0].chargedUsd,
                    preview,
                )
            }
        }

        const totalListVnd = this.sum(lines,
            "listVnd")
        const totalPhaseVnd = this.sum(lines,
            "phaseVnd")
        const quotedChargedVnd = this.sum(lines,
            "chargedVnd")
        const totalChargedVnd = voucherDiscountedPriceVnd ?? quotedChargedVnd
        const installmentOptions = this.installments.computeInstallmentOptions(totalChargedVnd)
        const selectedInstallment = installmentMonths
            ? this.installments.computeInstallmentTotal(totalChargedVnd,
                installmentMonths)
            : null
        return {
            lines,
            totalListVnd,
            totalPhaseVnd,
            totalChargedVnd,
            totalListUsd: this.sumNullable(lines,
                "listUsd"),
            totalPhaseUsd: this.sumNullable(lines,
                "phaseUsd"),
            totalChargedUsd: voucherDiscountedPriceUsd ?? this.sumNullable(lines,
                "chargedUsd"),
            savingsVnd: Math.max(0,
                totalListVnd - totalChargedVnd),
            bundleDiscountPercent,
            itemCount: lines.length,
            voucherDiscountedPriceVnd,
            voucherDiscountedPriceUsd,
            installmentOptions,
            selectedInstallment,
        }
    }

    private async priceLine(
        input: Pick<CoursePriceQuoteLine,
        "course" | "loyaltyDiscountPercent" | "bundleDiscountPercent" |
        "displayDiscountPercent" | "discountReason" | "enrolledCount"> & {
            intent: CoursePriceQuoteIntent
        },
    ): Promise<CoursePriceQuoteLine> {
        const { intent, ...lineInput } = input
        const isDiscovery = intent === CoursePriceQuoteIntent.Discovery
        const resolveAmountVnd = (params: Parameters<CoursePriceCalculatorService["resolveAmountVnd"]>[0]) => isDiscovery
            ? this.calculator.resolveDisplayAmountVnd(params)
            : this.calculator.resolveAmountVnd(params)
        const resolveListAmountVnd = (params: Parameters<CoursePriceCalculatorService["resolveListAmountVnd"]>[0]) => isDiscovery
            ? this.calculator.resolveDisplayListAmountVnd(params)
            : this.calculator.resolveListAmountVnd(params)
        const currentPhase = this.calculator.getCurrentPricingPhase(input.course)
        const nextPhase = nextPricingPhase(currentPhase)
        const hasNextPhase = nextPhase !== currentPhase
        const row = input.course.pricingPhases.find((phase) => phase.phase === currentPhase)
        const seatsTaken = await this.entityManager.count(EnrollmentEntity,
            {
                where: {
                    course: {
                        id: input.course.id,
                    },
                    isEnrolled: true,
                },
            })
        let nextPhasePriceVnd: number | null = null
        if (hasNextPhase) {
            try {
                nextPhasePriceVnd = resolveAmountVnd({
                    course: input.course,
                    phase: nextPhase,
                })
            } catch {
                nextPhasePriceVnd = null
            }
        }
        const listVnd = resolveListAmountVnd({
            course: input.course,
        })
        const phaseVnd = resolveAmountVnd({
            course: input.course,
        })
        const chargedVnd = resolveAmountVnd({
            course: input.course,
            discountPercent: input.displayDiscountPercent,
        })
        const displayDiscountPercent = isDiscovery && listVnd > 0
            ? Math.round(Math.max(0,
                listVnd - chargedVnd) / listVnd * 100)
            : input.displayDiscountPercent
        return {
            ...lineInput,
            displayDiscountPercent,
            listVnd,
            phaseVnd,
            chargedVnd,
            listUsd: this.calculator.resolveListAmountUsd({
                course: input.course 
            }),
            phaseUsd: this.calculator.resolveAmountUsd({
                course: input.course 
            }),
            chargedUsd: this.calculator.resolveAmountUsd({
                course: input.course,
                discountPercent: input.displayDiscountPercent,
            }),
            pricingPhase: currentPhase,
            nextPhase: hasNextPhase ? nextPhase : null,
            seatsRemainingInCurrentPhase: row?.slotAvailable == null
                ? null
                : Math.max(0,
                    row.slotAvailable - seatsTaken),
            nextPhasePriceVnd,
            nextPhasePriceUsd: hasNextPhase
                ? this.calculator.resolveAmountUsd({
                    course: input.course,
                    phase: nextPhase,
                })
                : null,
        }
    }

    private async excludeOwnedCourses(
        userId: string,
        courses: Array<CourseEntity>,
    ): Promise<Array<CourseEntity>> {
        const enrollments = await this.entityManager.find(EnrollmentEntity,
            {
                where: {
                    user: {
                        id: userId 
                    },
                    course: {
                        id: In(courses.map((course) => course.id)) 
                    },
                    isEnrolled: true,
                },
            })
        const owned = new Set(enrollments.map((enrollment) => enrollment.courseId))
        return courses.filter((course) => !owned.has(course.id))
    }

    private sum(
        lines: Array<CoursePriceQuoteLine>,
        field: "listVnd" | "phaseVnd" | "chargedVnd",
    ): number {
        return lines.reduce((total, line) => total + line[field],
            0)
    }

    private sumNullable(
        lines: Array<CoursePriceQuoteLine>,
        field: "listUsd" | "phaseUsd" | "chargedUsd",
    ): number | null {
        if (lines.some((line) => line[field] == null)) {
            return null
        }
        return lines.reduce((total, line) => total + (line[field] ?? 0),
            0)
    }

    private emptyResult(): CoursePriceQuoteResult {
        return {
            lines: [],
            totalListVnd: 0,
            totalPhaseVnd: 0,
            totalChargedVnd: 0,
            totalListUsd: 0,
            totalPhaseUsd: 0,
            totalChargedUsd: 0,
            savingsVnd: 0,
            bundleDiscountPercent: 0,
            itemCount: 0,
            voucherDiscountedPriceVnd: null,
            voucherDiscountedPriceUsd: null,
            installmentOptions: [],
            selectedInstallment: null,
        }
    }
}
