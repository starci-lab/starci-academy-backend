import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    AbstractEntity,
} from "./abstract"
import {
    MilestoneTaskCodeImplementationEntity,
} from "./milestone-task-code-implementation.entity"

/**
 * Translation for {@link MilestoneTaskCodeImplementationEntity} fields (`guide`, `example`).
 */
@ObjectType({
    description: "Localized value for a milestone task code implementation field.",
})
@Entity("milestone_task_code_implementation_translations")
export class MilestoneTaskCodeImplementationTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target milestone task code implementation ID.",
        },
    )
    @PrimaryColumn({
        name: "milestone_task_code_implementation_id",
        type: "uuid",
    })
        milestoneTaskCodeImplementationId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation.",
        },
    )
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    @Field(
        () => String,
        {
            description: "Target field name (`guide` or `example`).",
        },
    )
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    @Field(
        () => String,
        {
            description: "Translated value for the field.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => MilestoneTaskCodeImplementationEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_code_implementation_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_mtci_id_mtask_code_impl_trans_mtask_code_impls",
    })
        milestoneTaskCodeImplementation: MilestoneTaskCodeImplementationEntity
}
