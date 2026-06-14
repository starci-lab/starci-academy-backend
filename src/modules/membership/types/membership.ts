import type {
    EntityManager,
} from "typeorm"

/**
 * Params for {@link MembershipService.grantMembership}.
 */
export interface GrantMembershipParams {
    /** Owner of the membership to grant/extend. */
    userId: string
    /** The funding transaction; marked succeeded inside the same DB transaction. */
    transactionId: string
}

/**
 * Params for {@link MembershipService.grantFreeMonths}.
 */
export interface GrantFreeMonthsParams {
    /** Owner of the membership to grant/extend. */
    userId: string
    /** Number of free months to add on top of any remaining time. */
    months: number
}

/**
 * Params for the internal period-extension helper.
 */
export interface ExtendPeriodParams {
    /** Owner of the membership to grant/extend. */
    userId: string
    /** Number of months to add on top of any remaining time. */
    months: number
    /** Active DB transaction manager the extension runs inside. */
    entityManager: EntityManager
}

/**
 * Result of {@link MembershipService.expireDue}.
 */
export interface ExpireDueMembershipsResult {
    /** Number of membership rows flipped to expired by this sweep. */
    expiredCount: number
}
