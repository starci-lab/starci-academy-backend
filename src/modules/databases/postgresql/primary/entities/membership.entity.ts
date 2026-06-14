import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
} from "typeorm"
import {
    GraphQLTypeMembershipStatus,
    MembershipStatus,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

/**
 * Per-user community membership (1-1 with {@link UserEntity}).
 *
 * A single paid product ($5/month equivalent) that unlocks the premium tech
 * blog, the private community, and the member course discount. Access is
 * granted on payment success and runs until {@link currentPeriodEnd}; a cron
 * sweep flips the row to {@link MembershipStatus.Expired} once that elapses.
 *
 * Membership is intentionally separate from course enrollment — it never
 * grants access to course content, only the member perks listed above.
 */
@ObjectType({
    description: "Per-user community membership: premium blog + community + course discount.",
})
@Entity("memberships")
export class MembershipEntity extends UuidAbstractEntity {
    /** Lifecycle status of the membership. */
    @Field(
        () => GraphQLTypeMembershipStatus,
        {
            description: "Lifecycle status of the membership.",
        },
    )
    @Column({
        name: "status",
        type: "enum",
        enum: MembershipStatus,
        enumName: "membership_status",
        default: MembershipStatus.Active,
    })
        status: MembershipStatus

    /** End of the current paid billing period; null before the first payment. */
    @Field(
        () => Date,
        {
            nullable: true,
            description: "End of the current paid billing period.",
        },
    )
    @Column({
        name: "current_period_end",
        type: "timestamptz",
        nullable: true,
    })
        currentPeriodEnd: Date | null

    /** Whether the membership auto-renews at period end (manual purchase = false). */
    @Field(
        () => Boolean,
        {
            description: "Whether the membership auto-renews at period end.",
        },
    )
    @Column({
        name: "auto_renew",
        type: "boolean",
        default: false,
    })
        autoRenew: boolean

    /** The user this membership belongs to. */
    @OneToOne(
        () => UserEntity,
        (user: UserEntity) => user.membership,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_user_id_memberships_users",
    })
        user: UserEntity
}
