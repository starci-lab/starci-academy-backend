import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    RefundCoursePurchaseCommand,
} from "./refund-course-purchase.command"
import {
    RefundCoursePurchaseHandler,
} from "./refund-course-purchase.handler"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    TransactionNotRefundableException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-refundable"
import {
    TransactionRefundReferenceConflictException,
} from "@modules/platform/exceptions/errors/transaction/transaction-refund-reference-conflict"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

const POSTGRESQL_PRIMARY = "primary"

describe("RefundCoursePurchaseHandler",
    () => {
        let module: TestingModule
        let handler: RefundCoursePurchaseHandler
        let entityManager: EntityManagerMock
        let userService: {
            invalidateEnrolledCourses: jest.Mock
        }

        const transaction = (
            overrides: Partial<TransactionEntity> = {
            },
        ): TransactionEntity => ({
            id: "transaction-1",
            status: TransactionStatus.Succeeded,
            actionType: ActionType.Enroll,
            installmentMonths: null,
            installmentPlanId: null,
            refundReference: null,
            refundReason: null,
            refundedAt: null,
            user: {
                id: "user-1",
            },
            userId: "user-1",
            course: {
                id: "course-1",
            },
            courseId: "course-1",
            ...overrides,
        } as TransactionEntity)

        const command = (
            providerRefundReference = "refund-1",
        ): RefundCoursePurchaseCommand => new RefundCoursePurchaseCommand({
            request: {
                transactionId: "transaction-1",
                providerRefundReference,
                reason: "settlement failed",
            },
        })

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            userService = {
                invalidateEnrolledCourses: jest.fn().mockResolvedValue(undefined),
            }
            module = await Test.createTestingModule({
                providers: [
                    RefundCoursePurchaseHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                ],
            }).compile()
            handler = module.get(RefundCoursePurchaseHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("records the provider evidence and closes the only entitlement in the same transaction",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(transaction())
                entityManager.query.mockResolvedValueOnce([])

                const result = await handler.execute(command())

                expect(result).toMatchObject({
                    status: TransactionStatus.Refunded,
                    providerRefundReference: "refund-1",
                    revokedCourseIds: ["course-1"],
                    alreadyRefunded: false,
                })
                expect(entityManager.transaction).toHaveBeenCalledTimes(1)
                expect(entityManager.findOne).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        lock: {
                            mode: "pessimistic_write",
                        },
                    }),
                )
                expect(entityManager.save).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: TransactionStatus.Refunded,
                        refundReference: "refund-1",
                        refundReason: "settlement failed",
                        refundedAt: expect.any(Date),
                    }),
                )
                expect(entityManager.update).toHaveBeenCalledWith(
                    EnrollmentEntity,
                    expect.any(Object),
                    {
                        isEnrolled: false,
                    },
                )
                expect(userService.invalidateEnrolledCourses).toHaveBeenCalledWith("user-1")
            })

        it("keeps access when another succeeded transaction still owns the course",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(transaction())
                entityManager.query.mockResolvedValueOnce([
                    {
                        course_id: "course-1",
                    },
                ])

                const result = await handler.execute(command())

                expect(result.revokedCourseIds).toEqual([])
                expect(entityManager.update).not.toHaveBeenCalled()
            })

        it("replays the same provider reference without committing a second reversal",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(transaction({
                    status: TransactionStatus.Refunded,
                    refundReference: "refund-1",
                    refundedAt: new Date("2026-08-11T00:00:00.000Z"),
                }))
                entityManager.query.mockResolvedValueOnce([])

                const result = await handler.execute(command())

                expect(result.alreadyRefunded).toBe(true)
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(entityManager.update).not.toHaveBeenCalled()
            })

        it("rejects replacement evidence for an already-refunded transaction",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(transaction({
                    status: TransactionStatus.Refunded,
                    refundReference: "refund-1",
                    refundedAt: new Date(),
                }))

                await expect(handler.execute(command("refund-2")))
                    .rejects.toBeInstanceOf(TransactionRefundReferenceConflictException)
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("rejects an unsettled transaction because no captured money exists to return",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(transaction({
                    status: TransactionStatus.Pending,
                }))

                await expect(handler.execute(command()))
                    .rejects.toBeInstanceOf(TransactionNotRefundableException)
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(userService.invalidateEnrolledCourses).not.toHaveBeenCalled()
            })

        it("rejects a settled transaction for a non-enrollment action",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(transaction({
                    actionType: ActionType.MembershipPurchase,
                }))

                await expect(handler.execute(command()))
                    .rejects.toBeInstanceOf(TransactionNotRefundableException)
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(userService.invalidateEnrolledCourses).not.toHaveBeenCalled()
            })

        it("fails when the transaction disappears before the refund is evaluated",
            async () => {
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(handler.execute(command())).rejects.toThrow()

                expect(entityManager.save).not.toHaveBeenCalled()
                expect(userService.invalidateEnrolledCourses).not.toHaveBeenCalled()
            })
    })
