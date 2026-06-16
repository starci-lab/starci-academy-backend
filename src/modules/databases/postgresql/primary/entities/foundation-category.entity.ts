import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    OneToMany,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    FoundationEntity,
} from "./foundation.entity"
import {
    FoundationCategoryTranslationEntity,
} from "./foundation-category-translation.entity"

/**
 * Foundation Category entity representing groups of foundations like docker, kubernetes, nodejs, etc.
 */
@ObjectType({
    description: "Foundation category entity representing groups of technical foundations.",
})
@Entity("foundation_categories")
export class FoundationCategoryEntity extends UuidAbstractEntity {
    /**
     * Human-readable category title.
     */
    @Field(
        () => String,
        {
            description: "Human-readable category title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 255,
    })
        title: string

    /**
     * Human-facing stable identifier for display and external references (not the primary key).
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier for display and external references (not the primary key).",
        },
    )
    @Column({
        name: "display_id",
        type: "varchar",
        length: 255,
        unique: true,
    })
        displayId: string

    /**
     * SEO-friendly slug used for public routing.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "SEO-friendly slug used for public routing.",
        },
    )
    @Column({
        name: "slug",
        type: "varchar",
        length: 255,
        unique: true,
        nullable: true,
    })
        slug: string | null

    /**
     * Short public description of the category.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Short public description of the category.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    /**
     * Thumbnail URL of the category.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Cover image URL of the category.",
        },
    )
    @Column({
        name: "thumbnail_url",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        thumbnailUrl: string | null

    /**
     * Display order within the category list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the category list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Pure ordering index used to reorder the list (decoupled from orderIndex).
     */
    @Field(() => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex)." 
        })
    @Column({
        name: "sort_index", type: "int", default: 0 
    })
        sortIndex: number

    /**
     * Default locale for the category.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for category copy when no translation applies.",
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
     * Localized translations of category fields such as title and description.
     */
    @Field(
        () => [FoundationCategoryTranslationEntity],
        {
            description: "Localized overrides for category fields (e.g. title, description).",
        },
    )
    @OneToMany(
        () => FoundationCategoryTranslationEntity,
        (translation: FoundationCategoryTranslationEntity) => translation.category,
        {
            cascade: true,
        },
    )
        translations: Array<FoundationCategoryTranslationEntity>

    /**
     * Ordered foundations belonging to the category.
     */
    @Field(
        () => [FoundationEntity],
        {
            description: "Ordered foundations belonging to the category.",
        },
    )
    @OneToMany(
        () => FoundationEntity,
        (foundation: FoundationEntity) => foundation.category,
        {
            cascade: true,
        },
    )
        foundations: Array<FoundationEntity>
}
