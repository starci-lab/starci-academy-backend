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
    MilestoneTaskCriteriaEntity,
} from "./milestone-task-criteria.entity"

/**
 * Translation entity for milestone task criteria fields (text, promptText).
 * Primary key: (milestoneTaskCriteriaId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific milestone task criterion field.",
})
@Entity("milestone_task_criteria_translations")
export class MilestoneTaskCriteriaTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target milestone task criteria ID.",
        },
    )
    @PrimaryColumn({
        name: "milestone_task_criteria_id",
        type: "uuid",
    })
        milestoneTaskCriteriaId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation (e.g. vi, en).",
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
            description: "Target field name being translated.",
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
        () => MilestoneTaskCriteriaEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_criteria_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_criteria_id_milestone_task_criteria_translations_milestone_task_criteria",
    })
        milestoneTaskCriteria: MilestoneTaskCriteriaEntity
}
