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
    MilestoneTaskEntity,
} from "./milestone-task.entity"

@ObjectType({
    description: "Localized value for a specific milestone task field.",
})
@Entity("milestone_task_translations")
/**
 * Translation entity for milestone task fields (title, description).
 * Primary key: (milestoneTaskId, locale, field).
 */
export class MilestoneTaskTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target milestone task ID.",
        },
    )
    @PrimaryColumn({
        name: "milestone_task_id",
        type: "uuid",
    })
        milestoneTaskId: string

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
        () => MilestoneTaskEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_milestone_task_id_milestone_task_translations_milestone_tasks",
    })
        milestoneTask: MilestoneTaskEntity
}
