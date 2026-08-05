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
    PlaygroundStepEntity,
} from "./playground-step.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

@ObjectType({
    description: "Localized value for a specific playground step field.",
})
@Entity("playground_step_translations")
/**
 * Translation entity storing localized values for playground step fields.
 *
 * Each row represents:
 * (playgroundStepId, locale, field) -> translated value
 *
 * Primary key is the composite (playgroundStepId, locale, field). Mirrors
 * {@link import("./content-translation.entity").ContentTranslationEntity}.
 */
export class PlaygroundStepTranslationEntity extends AbstractEntity {
    /**
     * Target playground step ID (part of composite primary key).
     */
    @Field(
        () => String,
        {
            description: "Target playground step ID.",
        },
    )
    @PrimaryColumn({
        name: "playground_step_id",
        type: "uuid",
    })
        playgroundStepId: string

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
     * Target field name being translated (e.g., title, body).
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
     * Reference to the parent playground step.
     * Cascade delete ensures translations are removed when the step is deleted.
     */
    @ManyToOne(
        () => PlaygroundStepEntity,
        (step: PlaygroundStepEntity) => step.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "playground_step_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_playground_step_id_playground_step_translations",
    })
        playgroundStep: PlaygroundStepEntity
}
