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
    PrerequisiteEntity,
} from "./prerequisite.entity"

/**
 * Translation entity for prerequisite fields.
 * Primary key: (prerequisiteId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific prerequisite field.",
})
@Entity("prerequisite_translations")
export class PrerequisiteTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target prerequisite ID.",
        },
    )
    @PrimaryColumn({
        name: "prerequisite_id",
        type: "uuid",
    })
        prerequisiteId: string

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
        () => PrerequisiteEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "prerequisite_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_prerequisite_id_prerequisite_translations_prerequisites",
    })
        prerequisite: PrerequisiteEntity
}
