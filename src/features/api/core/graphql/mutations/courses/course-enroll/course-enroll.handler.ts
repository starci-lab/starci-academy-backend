import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    PaymentType,
    VoucherDiscountType,
} from "@modules/databases"
import {
    CourseAlreadyEnrolledError,
    InstallmentCurrencyNotSupportedException,
    UnsupportedPaymentTypeException,
    UserNotFoundException,
    VoucherNotSupportedForGatewayException,
} from "@modules/exceptions"
import {
    PAYMENT_MODIFIER_CAPABILITY,
    VoucherService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseEnrollCommand,
} from "./course-enroll.command"
import {
    CourseEnrollPayOsService,
} from "./course-enroll-payos.service"
import {
    CourseEnrollSepayService,
} from "./course-enroll-sepay.service"
import {
    CourseEnrollStripeService,
} from "./course-enroll-stripe.service"
import {
    CourseEnrollPaypalService,
} from "./course-enroll-paypal.service"
import {
    CourseEnrollCryptoService,
} from "./course-enroll-crypto.service"
import {
    CourseEnrollResponseData,
} from "./graphql-types"

@CommandHandler(CourseEnrollCommand)
@Injectable()
/**
 * Routes one course to the chosen gateway after voucher and enrollment checks;
 * does not unlock the course until payment succeeds out of band.
 */
export class CourseEnrollHandler
    extends ICQRSHandler<CourseEnrollCommand, CourseEnrollResponseData>
    implements ICommandHandler<CourseEnrollCommand, CourseEnrollResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly courseEnrollPayOsService: CourseEnrollPayOsService,
        private readonly courseEnrollSepayService: CourseEnrollSepayService,
        private readonly courseEnrollStripeService: CourseEnrollStripeService,
        private readonly courseEnrollPaypalService: CourseEnrollPaypalService,
        private readonly courseEnrollCryptoService: CourseEnrollCryptoService,
        private readonly voucherService: VoucherService,
    ) {
        super()
    }

    protected override async process(
        command: CourseEnrollCommand,
    ): Promise<CourseEnrollResponseData> {
        const params = command.params
        const {
            request,
            user,
        } = params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const {
            courseId,
            paymentType,
            installmentMonths,
            voucherCode,
        } = request

        // SSOT capability matrix — see PAYMENT_MODIFIER_CAPABILITY for the design
        // decision (.artifacts/states/transactions/business.md § "Payment-modifier
        // capability model"). Both checks below reject LOUD, before any row or
        // checkout is created — never a silent drop, never a runtime FX conversion.
        const capability = PAYMENT_MODIFIER_CAPABILITY[paymentType]

        // installments (trả góp) are VND-only — the non-domestic gateways can't
        // collect the later cycles, so refuse before creating anything
        if (installmentMonths && !capability?.supportsInstallment) {
            throw new InstallmentCurrencyNotSupportedException({
                paymentType: String(paymentType),
            })
        }

        // a voucher's DISCOUNT TYPE decides its portability: Percent is
        // currency-agnostic and honoured everywhere; Flat is VND-denominated and
        // must reject on a USD gateway rather than silently being dropped (the
        // as-built gap this closes — see findings.md #3). The preview here is
        // advisory only (no lock) — each provider service re-validates + reserves
        // under lock right before it persists the pending transaction.
        if (voucherCode) {
            const {
                discountType,
            } = await this.voucherService.previewDiscount({
                userId: user.id,
                code: voucherCode,
                courseId,
            })
            const supported = discountType === VoucherDiscountType.Percent
                ? capability?.supportsVoucherPercent
                : capability?.supportsVoucherFlat
            if (!supported) {
                throw new VoucherNotSupportedForGatewayException({
                    paymentType: String(paymentType),
                    discountType,
                })
            }
        }

        const alreadyEnrolled = await this.entityManager.exists(
            EnrollmentEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (alreadyEnrolled) {
            throw new CourseAlreadyEnrolledError({
                courseId,
                userId: user.id,
            })
        }

        switch (paymentType) {
        case PaymentType.PayOS: {
            return this.courseEnrollPayOsService.execute(params)
        }
        case PaymentType.Sepay: {
            return this.courseEnrollSepayService.execute(params)
        }
        case PaymentType.Stripe: {
            return this.courseEnrollStripeService.execute(params)
        }
        case PaymentType.Paypal: {
            return this.courseEnrollPaypalService.execute(params)
        }
        case PaymentType.Crypto: {
            return this.courseEnrollCryptoService.execute(params)
        }
        default:
            throw new UnsupportedPaymentTypeException({
                paymentType: String(paymentType),
            })
        }
    }
}
