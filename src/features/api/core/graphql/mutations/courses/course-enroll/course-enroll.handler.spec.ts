// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    BadRequestException,
} from "@nestjs/common"
import {
    PaymentType,
} from "@modules/databases"
import {
    CourseAlreadyEnrolledError,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserEntity,
} from "@modules/databases"
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
                ).rejects.toBeInstanceOf(CourseAlreadyEnrolledError)

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

        it("throws BadRequest for an unsupported payment type",
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
                ).rejects.toBeInstanceOf(BadRequestException)

                // no provider matches an unknown payment type
                expect(payos.execute).not.toHaveBeenCalled()
                expect(crypto.execute).not.toHaveBeenCalled()
            })
    })
