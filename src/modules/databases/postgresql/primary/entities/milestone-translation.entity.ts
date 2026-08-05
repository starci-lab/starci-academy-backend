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
} from "../enums/locale"
import {
    AbstractEntity,
} from "./abstract"
import {
    MilestoneEntity,
} from "./milestone.entity"

@ObjectType({
    description: "Localized value for a specific milestone field.",
})
@Entity("milestone_translations")
/**
 * Translation entity for milestone fields (title, description).
 * Primary key: (milestoneId, locale, field).
 */
export class MilestoneTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target milestone ID.",
        },
    )
    @PrimaryColumn({
        name: "milestone_id",
        type: "uuid",
    })
        milestoneId: string

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
        () => MilestoneEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "milestone_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_milestone_id_milestone_translations_milestones",
    })
        milestone: MilestoneEntity
}
