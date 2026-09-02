import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    TransactionEntity,
} from "./transaction.entity"
import {
    UserEntity,
} from "./user.entity"

@ObjectType({
    description: "Immutable paid-period evidence for a StarCi Pro grant.",
})
@Entity("pro_entitlement_sources")
/** One immutable audit row for each transaction that funded a Pro period. */
export class ProEntitlementSourceEntity extends UuidAbstractEntity {
    @ManyToOne(() => UserEntity,
        {
            onDelete: "CASCADE",
        })
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_pro_entitlement_sources_users",
    })
        user: UserEntity

    @Field(() => String)
    @RelationId((source: ProEntitlementSourceEntity) => source.user)
        userId: string

    @Index("uq_pro_entitlement_sources_transaction_id",
        {
            unique: true,
        })
    @OneToOne(() => TransactionEntity,
        {
            onDelete: "RESTRICT",
        })
    @JoinColumn({
        name: "transaction_id",
        foreignKeyConstraintName: "fk_transaction_id_pro_entitlement_sources_transactions",
    })
        transaction: TransactionEntity

    @Field(() => String)
    @RelationId((source: ProEntitlementSourceEntity) => source.transaction)
        transactionId: string

    @Field(() => Date)
    @Column({
        name: "period_start",
        type: "timestamptz",
    })
        periodStart: Date

    @Field(() => Date)
    @Column({
        name: "period_end",
        type: "timestamptz",
    })
        periodEnd: Date

    @Field(() => String)
    @Column({
        name: "offer_revision",
        type: "varchar",
        length: 64,
    })
        offerRevision: string
}
