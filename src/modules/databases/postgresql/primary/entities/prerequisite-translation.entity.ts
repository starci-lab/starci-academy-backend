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
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    PrerequisiteEntity,
} from "./prerequisite.entity"

/**
 * Translation entity storing localized values for prerequisite fields.
 *
 * Each row represents:
 * (prerequisiteId, locale, field) -> translated value
 */
@ObjectType({
    description: "Localized value for a specific prerequisite field.",
})
@Entity("prerequisite_translations")
@Index(
    "uq_prerequisite_translation",
    [
        "prerequisiteId",
        "locale",
        "field",
    ],
    {
        unique: true,
    },
)
export class PrerequisiteTranslationEntity extends UuidAbstractEntity {
    /**
     * Target prerequisite ID.
     */
    @Field(
        () => String,
        {
            description: "Target prerequisite ID.",
        },
    )
    @Column({
        name: "prerequisite_id",
        type: "varchar",
        length: 255,
    })
        prerequisiteId: string

    /**
     * Locale of the translation (e.g., vi, en).
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Target field name being translated (e.g., content).
     */
    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @Column({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /**
     * Translated value for the field.
     */
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

    /**
     * Reference to the parent prerequisite.
     * Cascade delete ensures translations are removed when prerequisite is deleted.
     */
    @ManyToOne(
        () => PrerequisiteEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "prerequisite_id",
        referencedColumnName: "id",
    })
        prerequisite: PrerequisiteEntity
}

