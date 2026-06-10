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
    MilestoneTaskBriefEntity,
} from "./milestone-task-brief.entity"

/**
 * Translation for {@link MilestoneTaskBriefEntity} fields (`body`).
 */
@ObjectType({
    description: "Localized value for a milestone task brief field.",
})
@Entity("milestone_task_brief_translations")
export class MilestoneTaskBriefTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target milestone task brief ID.",
        },
    )
    @PrimaryColumn({
        name: "milestone_task_brief_id",
        type: "uuid",
    })
        milestoneTaskBriefId: string

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
            description: "Target field name (`body`).",
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
        () => MilestoneTaskBriefEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_task_brief_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_mtb_id_mtb_trans_mtbs",
    })
        milestoneTaskBrief: MilestoneTaskBriefEntity
}
