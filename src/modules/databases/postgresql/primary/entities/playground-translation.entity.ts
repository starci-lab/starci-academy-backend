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
    AbstractEntity,
} from "./abstract"
import {
    PlaygroundEntity,
} from "./playground.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity storing localized values for playground fields.
 *
 * Each row represents:
 * (playgroundId, locale, field) -> translated value
 *
 * Primary key is the composite (playgroundId, locale, field). Mirrors
 * {@link import("./content-translation.entity").ContentTranslationEntity}.
 */
@ObjectType({
    description: "Localized value for a specific playground field.",
})
@Entity("playground_translations")
export class PlaygroundTranslationEntity extends AbstractEntity {
    /**
     * Target playground ID (part of composite primary key).
     */
    @Field(
        () => String,
        {
            description: "Target playground ID.",
        },
    )
    @PrimaryColumn({
        name: "playground_id",
        type: "uuid",
    })
        playgroundId: string

    /**
     * Locale of the translation (e.g., vi, en).
     */
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

    /**
     * Target field name being translated (e.g., title, description).
     */
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
     * Reference to the parent playground.
     * Cascade delete ensures translations are removed when the playground is deleted.
     */
    @ManyToOne(
        () => PlaygroundEntity,
        (playground: PlaygroundEntity) => playground.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "playground_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_playground_id_playground_translations",
    })
        playground: PlaygroundEntity
}
