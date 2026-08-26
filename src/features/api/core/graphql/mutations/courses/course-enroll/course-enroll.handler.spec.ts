// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    CourseAlreadyEnrolledException,
} from "@modules/platform/exceptions/errors/courses/course-already-enrolled"
import {
    UnsupportedPaymentTypeException,
} from "@modules/platform/exceptions/errors/payment/unsupported-payment-type"
import {
    InstallmentCurrencyNotSupportedException,
} from "@modules/platform/exceptions/errors/payment/installment-currency-not-supported"
import {
    VoucherNotSupportedForGatewayException,
} from "@modules/platform/exceptions/errors/payment/voucher-not-supported-for-gateway"
import {
    VoucherDiscountType,
} from "@modules/databases/postgresql/primary/enums/voucher-discount-type"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    CoursePriceQuoteService,
} from "@modules/bussiness/course-pricing/course-price-quote.service"
import {
    CourseEnrollCommand,
} from "./course-enroll.command"
import {
    CourseEnrollHandler,
} from "./course-enroll.handler"
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

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** Each per-provider service exposes the same `execute` hand-off shape. */
interface ProviderServiceMock {
    /** Builds the checkout for that provider; mocked per-test. */
    execute: jest.Mock
}

describe("CourseEnrollHandler",
    () => {
        let module: TestingModule
        let handler: CourseEnrollHandler
        let entityManager: EntityManagerMock
        let payos: ProviderServiceMock
        let sepay: ProviderServiceMock
        let stripe: ProviderServiceMock
        let paypal: ProviderServiceMock
        let crypto: ProviderServiceMock
        let voucherService: {
            previewDiscount: jest.Mock
        }
        let priceQuotes: {
            quote: jest.Mock
        }

        beforeEach(async () => {
            // fresh jest-backed entity manager; `exists` is not on the shared mock
            entityManager = makeEntityManagerMock()
            // default: not yet enrolled so the happy path proceeds
            entityManager.exists = jest.fn().mockResolvedValue(false)

            // one stub per provider service, each echoing a provider-tagged result
            payos = {
                execute: jest.fn().mockResolvedValue({
                    checkoutUrl: "payos-url",
                }),
            }
            sepay = {
                execute: jest.fn().mockResolvedValue({
                    checkoutUrl: "sepay-url",
                }),
            }
            stripe = {
                execute: jest.fn().mockResolvedValue({
                    checkoutUrl: "stripe-url",
                }),
            }
            paypal = {
                execute: jest.fn().mockResolvedValue({
                    checkoutUrl: "paypal-url",
                }),
            }
            crypto = {
                execute: jest.fn().mockResolvedValue({
                    checkoutUrl: "crypto-url",
                }),
            }
            // no test in this file exercises voucherCode -- default resolves nothing
            voucherService = {
                previewDiscount: jest.fn(),
            }
            priceQuotes = {
                quote: jest.fn().mockResolvedValue({
                    lines: [{
                        course: {
                            id: "course-1"
                        }
                    }],
                    totalChargedVnd: 1250000,
                    totalChargedUsd: 50,
                    selectedInstallment: null,
                }),
            }

            module = await Test.createTestingModule({
                providers: [
                    CourseEnrollHandler,
                    {
                        provide: CourseEnrollPayOsService,
                        useValue: payos,
                    },
                    {
                        provide: CourseEnrollSepayService,
                        useValue: sepay,
                    },
                    {
                        provide: CourseEnrollStripeService,
                        useValue: stripe,
                    },
                    {
                        provide: CourseEnrollPaypalService,
                        useValue: paypal,
                    },
                    {
                        provide: CourseEnrollCryptoService,
                        useValue: crypto,
                    },
                    {
                        provide: VoucherService,
                        useValue: voucherService,
                    },
                    {
                        provide: CoursePriceQuoteService,
                        useValue: priceQuotes,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<CourseEnrollHandler>(CourseEnrollHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no enrollment check)",
            async () => {
                await expect(
                    handler.execute(
                        new CourseEnrollCommand({
                            request: {
                                courseId: "course-1",
                                paymentType: PaymentType.PayOS,
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before probing for an existing enrollment
                expect(entityManager.exists).not.toHaveBeenCalled()
            })

        it("rejects when the user is already enrolled (no provider dispatch)",
            async () => {
                // an enrollment already exists for this user + course
                entityManager.exists.mockResolvedValueOnce(true)

                await expect(
                    handler.execute(
                        new CourseEnrollCommand({
                            request: {
                                courseId: "course-1",
                                paymentType: PaymentType.PayOS,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(CourseAlreadyEnrolledException)

                // no provider service is invoked for a duplicate enrollment
                expect(payos.execute).not.toHaveBeenCalled()
            })

        it("dispatches to the PayOS service and returns its checkout",
            async () => {
                const result = await handler.execute(
                    new CourseEnrollCommand({
                        request: {
                            courseId: "course-1",
                            paymentType: PaymentType.PayOS,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // only the PayOS provider runs for a payos payment type
                expect(payos.execute).toHaveBeenCalledTimes(1)
                expect(payos.execute).toHaveBeenCalledWith(
                    expect.any(Object),
                    expect.objectContaining({
                        totalChargedVnd: 1250000
                    }),
                )
                expect(sepay.execute).not.toHaveBeenCalled()
                expect(result).toEqual({
                    checkoutUrl: "payos-url",
                })
            })

        it("dispatches to the Stripe service for a stripe payment type",
            async () => {
                const result = await handler.execute(
                    new CourseEnrollCommand({
                        request: {
                            courseId: "course-1",
                            paymentType: PaymentType.Stripe,
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                expect(stripe.execute).toHaveBeenCalledTimes(1)
                expect(result).toEqual({
                    checkoutUrl: "stripe-url",
                })
            })

        it("throws UnsupportedPaymentTypeException for an unsupported payment type",
            async () => {
                await expect(
                    handler.execute(
                        new CourseEnrollCommand({
                            request: {
                                courseId: "course-1",
                                paymentType: "bitcoin-cash" as PaymentType,
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(UnsupportedPaymentTypeException)

                // no provider matches an unknown payment type
                expect(payos.execute).not.toHaveBeenCalled()
                expect(crypto.execute).not.toHaveBeenCalled()
            })
        it("dispatches domestic and international gateway variants with the quoted price",
            async () => {
                const cases: Array<{ paymentType: PaymentType; service: ProviderServiceMock; result: string }> = [
                    {
                        paymentType: PaymentType.Sepay,
                        service: sepay,
                        result: "sepay-url",
                    },
                    {
                        paymentType: PaymentType.Paypal,
                        service: paypal,
                        result: "paypal-url",
                    },
                    {
                        paymentType: PaymentType.Crypto,
                        service: crypto,
                        result: "crypto-url",
                    },
                ]
                for (const testCase of cases) {
                    await expect(handler.execute(new CourseEnrollCommand({
                        request: {
                            courseId: "course-1",
                            paymentType: testCase.paymentType,
                        },
                        user: fakeUser("user-1"),
                    }))).resolves.toEqual({
                        checkoutUrl: testCase.result,
                    })
                    expect(testCase.service.execute).toHaveBeenCalledTimes(1)
                    testCase.service.execute.mockClear()
                }
            })
        it("rejects installments on USD gateways before voucher or enrollment work",
            async () => {
                await expect(handler.execute(new CourseEnrollCommand({
                    request: {
                        courseId: "course-1",
                        paymentType: PaymentType.Stripe,
                        installmentMonths: 3,
                    },
                    user: fakeUser("user-1"),
                }))).rejects.toBeInstanceOf(InstallmentCurrencyNotSupportedException)
                expect(entityManager.exists).not.toHaveBeenCalled()
                expect(priceQuotes.quote).not.toHaveBeenCalled()
            })
        it("accepts percent vouchers on USD gateways and passes the code to quote",
            async () => {
                voucherService.previewDiscount.mockResolvedValueOnce({
                    discountType: VoucherDiscountType.Percent,
                })
                await handler.execute(new CourseEnrollCommand({
                    request: {
                        courseId: "course-1",
                        paymentType: PaymentType.Stripe,
                        voucherCode: "PERCENT10",
                    },
                    user: fakeUser("user-1"),
                }))
                expect(voucherService.previewDiscount).toHaveBeenCalledWith({
                    userId: "user-1",
                    code: "PERCENT10",
                    courseId: "course-1",
                })
                expect(priceQuotes.quote).toHaveBeenCalledWith(expect.objectContaining({
                    voucherCode: "PERCENT10",
                }))
            })
        it("rejects flat vouchers on USD gateways before checking enrollment",
            async () => {
                voucherService.previewDiscount.mockResolvedValueOnce({
                    discountType: VoucherDiscountType.Flat,
                })
                await expect(handler.execute(new CourseEnrollCommand({
                    request: {
                        courseId: "course-1",
                        paymentType: PaymentType.Paypal,
                        voucherCode: "FLAT500",
                    },
                    user: fakeUser("user-1"),
                }))).rejects.toBeInstanceOf(VoucherNotSupportedForGatewayException)
                expect(entityManager.exists).not.toHaveBeenCalled()
            })

        it("propagates quote failures without creating a payment transaction",
            async () => {
                const failure = new Error("quote unavailable")
                priceQuotes.quote.mockRejectedValueOnce(failure)

                await expect(handler.execute(new CourseEnrollCommand({
                    request: {
                        courseId: "course-1",
                        paymentType: PaymentType.Stripe,
                    },
                    user: fakeUser("user-1"),
                }))).rejects.toBe(failure)
                expect(entityManager.create).not.toHaveBeenCalled()
            })
    })
