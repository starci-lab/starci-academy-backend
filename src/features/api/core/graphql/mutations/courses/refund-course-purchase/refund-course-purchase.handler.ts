import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    TransactionItemEntity,
} from "@modules/databases/postgresql/primary/entities/transaction-item.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    TransactionNotRefundableException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-refundable"
import {
    TransactionRefundReferenceConflictException,
} from "@modules/platform/exceptions/errors/transaction/transaction-refund-reference-conflict"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    RefundCoursePurchaseCommand,
} from "./refund-course-purchase.command"
import {
    RefundCoursePurchaseData,
} from "./graphql-types/response"

interface RemainingPurchaseRow {
    course_id: string
}

interface CommittedRefund {
    userId: string
    response: RefundCoursePurchaseData
}

@CommandHandler(RefundCoursePurchaseCommand)
@Injectable()
/**
 * Owns the provider-confirmed refund decision and commits its financial audit
 * state together with entitlement reversal in one locked database transaction.
 *
 * The provider reference is evidence and the retry key. Money moves upstream
 * first because the supported gateways have no shared refund primitive;
 * especially, bank-transfer providers require an out-of-band transfer.
 */
export class RefundCoursePurchaseHandler
    extends ICQRSHandler<RefundCoursePurchaseCommand, RefundCoursePurchaseData>
    implements ICommandHandler<RefundCoursePurchaseCommand, RefundCoursePurchaseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {
        super()
    }

    /**
     * Commits a settled course purchase's local reversal or safely replays it.
     *
     * @param command - Request context containing immutable provider evidence.
     * @returns The final refund state and courses whose access closed.
     */
    protected override async process(
        command: RefundCoursePurchaseCommand,
    ): Promise<RefundCoursePurchaseData> {
        const {
            transactionId,
            providerRefundReference,
            reason,
        } = command.params.request
        const committed = await this.entityManager.transaction(async (manager) => {
            const transaction = await manager.findOne(
                TransactionEntity,
                {
                    where: {
                        id: transactionId,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                },
            )
            if (!transaction) {
                throw new TransactionNotFoundException({
                    id: transactionId,
                })
            }

            if (transaction.status === TransactionStatus.Refunded) {
                return this.replayRefund(
                    manager,
                    transaction,
                    providerRefundReference,
                )
            }

            this.assertRefundable(transaction)
            const purchasedCourseIds = await this.courseIdsFor(manager,
                transaction)
            if (purchasedCourseIds.length === 0) {
                throw new TransactionNotRefundableException({
                    id: transaction.id,
                    status: transaction.status,
                    reason: "the transaction has no course entitlement",
                })
            }

            transaction.status = TransactionStatus.Refunded
            transaction.refundReference = providerRefundReference
            transaction.refundReason = reason
            transaction.refundedAt = new Date()
            await manager.save(transaction)

            const courseIdsStillOwned = await this.remainingSucceededCourseIds(
                manager,
                transaction.userId,
                purchasedCourseIds,
                transaction.id,
            )
            const revokedCourseIds = purchasedCourseIds.filter(
                (courseId) => !courseIdsStillOwned.has(courseId),
            )
            if (revokedCourseIds.length > 0) {
                await manager.update(
                    EnrollmentEntity,
                    {
                        user: {
                            id: transaction.userId,
                        },
                        course: {
                            id: In(revokedCourseIds),
                        },
                    },
                    {
                        isEnrolled: false,
                    },
                )
            }

            return {
                userId: transaction.userId,
                response: this.toResponse(transaction,
                    revokedCourseIds,
                    false),
            }
        })

        // A cache miss after this point can only rebuild from committed state.
        await this.userService.invalidateEnrolledCourses(committed.userId)
        return committed.response
    }

    private async replayRefund(
        manager: EntityManager,
        transaction: TransactionEntity,
        providerRefundReference: string,
    ): Promise<CommittedRefund> {
        if (transaction.refundReference !== providerRefundReference) {
            throw new TransactionRefundReferenceConflictException({
                id: transaction.id,
                expectedReference: transaction.refundReference ?? "",
                receivedReference: providerRefundReference,
            })
        }
        const purchasedCourseIds = await this.courseIdsFor(manager,
            transaction)
        const stillOwned = await this.remainingSucceededCourseIds(
            manager,
            transaction.userId,
            purchasedCourseIds,
            transaction.id,
        )
        return {
            userId: transaction.userId,
            response: this.toResponse(
                transaction,
                purchasedCourseIds.filter((courseId) => !stillOwned.has(courseId)),
                true,
            ),
        }
    }

    private assertRefundable(transaction: TransactionEntity): void {
        if (transaction.status !== TransactionStatus.Succeeded) {
            throw new TransactionNotRefundableException({
                id: transaction.id,
                status: transaction.status,
                reason: "only a succeeded transaction has captured money to return",
            })
        }
        if (transaction.actionType !== ActionType.Enroll) {
            throw new TransactionNotRefundableException({
                id: transaction.id,
                status: transaction.status,
                reason: "only course-enrollment transactions belong to this operation",
            })
        }
        if (transaction.installmentMonths !== null || transaction.installmentPlanId !== null) {
            throw new TransactionNotRefundableException({
                id: transaction.id,
                status: transaction.status,
                reason: "installment refunds require a plan-level reversal",
            })
        }
    }

    private async courseIdsFor(
        manager: EntityManager,
        transaction: TransactionEntity,
    ): Promise<Array<string>> {
        if (transaction.courseId) {
            return [transaction.courseId]
        }
        const items = await manager.find(
            TransactionItemEntity,
            {
                where: {
                    transaction: {
                        id: transaction.id,
                    },
                },
                relations: {
                    course: true,
                },
            },
        )
        return [...new Set(items.map((item) => item.course.id))]
    }

    private async remainingSucceededCourseIds(
        manager: EntityManager,
        userId: string,
        courseIds: Array<string>,
        refundedTransactionId: string,
    ): Promise<Set<string>> {
        const rows = await manager.query<Array<RemainingPurchaseRow>>(
            `
                SELECT DISTINCT owned.course_id
                FROM (
                    SELECT t.course_id
                    FROM transactions t
                    WHERE t.user_id = $1
                      AND t.id <> $2
                      AND t.status = $3
                      AND t.course_id = ANY($4::uuid[])
                    UNION
                    SELECT ti.course_id
                    FROM transactions t
                    INNER JOIN transaction_items ti ON ti.transaction_id = t.id
                    WHERE t.user_id = $1
                      AND t.id <> $2
                      AND t.status = $3
                      AND ti.course_id = ANY($4::uuid[])
                ) owned
            `,
            [
                userId,
                refundedTransactionId,
                TransactionStatus.Succeeded,
                courseIds,
            ],
        )
        return new Set(rows.map((row) => row.course_id))
    }

    private toResponse(
        transaction: TransactionEntity,
        revokedCourseIds: Array<string>,
        alreadyRefunded: boolean,
    ): RefundCoursePurchaseData {
        return {
            transactionId: transaction.id,
            status: TransactionStatus.Refunded,
            providerRefundReference: transaction.refundReference ?? "",
            revokedCourseIds,
            alreadyRefunded,
            refundedAt: transaction.refundedAt ?? new Date(),
        }
    }
}
