import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    OneToMany,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    TemplateCVTranslationEntity,
} from "./template-cv-translation.entity"

@ObjectType({
    description: "A CV review template with grading rubric and rules for a specific seniority level.",
})
@Entity("template_cvs")
/**
 * A CV review template with grading rubric and rules for a specific seniority level.
 * Each template contains the full review rules markdown seeded from `.mount/data/cv/`.
 */
export class TemplateCVEntity extends UuidAbstractEntity {
    /**
     * Unique key identifying the template level, e.g. "0-standard", "1-mid", "2-senior".
     */
    @Field(
        () => String,
        {
            description: "Unique key identifying the template level.",
        },
    )
    @Column({
        name: "key",
        type: "varchar",
        length: 100,
        unique: true,
    })
        key: string

    /**
     * Template title (default locale).
     */
    @Field(
        () => String,
        {
            description: "Template title (default locale).",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Template description (default locale).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Template description (default locale).",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Display order.
     */
    @Field(
        () => Int,
        {
            description: "Display order.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(() => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex)." 
        })
    @Column({
        name: "sort_index", type: "int", default: 0 
    })
        sortIndex: number

    /**
     * Default locale for this template row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this template row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Localized translations for fields such as title, description, body.
     */
    @Field(
        () => [TemplateCVTranslationEntity],
        {
            description: "Localized overrides for template CV fields.",
        },
    )
    @OneToMany(
        () => TemplateCVTranslationEntity,
        (translation: TemplateCVTranslationEntity) => translation.templateCV,
        {
            cascade: true,
        },
    )
        translations: Array<TemplateCVTranslationEntity>
}
