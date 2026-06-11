import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    FoundationKind,
    GraphQLTypeFoundationKind,
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    FoundationCategoryEntity,
} from "./foundation-category.entity"
import {
    FoundationTagEntity,
} from "./foundation-tag.entity"
import {
    FoundationTranslationEntity,
} from "./foundation-translation.entity"

/**
 * Foundation item within a specific category.
 * Represents a single learning resource with a kind (external_link | video | document).
 */
@ObjectType({
    description: "Foundation resource item attached to a foundation category.",
})
@Entity("foundations")
export class FoundationEntity extends UuidAbstractEntity {
    /**
     * Display title of the foundation item.
     */
    @Field(
        () => String,
        {
            description: "Display title of the foundation item.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Human-facing stable identifier.
     */
    @Field(
        () => String,
        {
            description: "Human-facing stable identifier for the foundation.",
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
     * Optional short description of the foundation item.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional short description of the foundation item.",
        },
    )
    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
        description: string | null

    /**
     * The kind/type of resource this foundation represents.
     */
    @Field(
        () => GraphQLTypeFoundationKind,
        {
            description: "Kind of resource: external_link | video | document.",
        },
    )
    @Column({
        name: "kind",
        type: "enum",
        enum: FoundationKind,
        enumName: "foundation_kind",
    })
        kind: FoundationKind

    /**
     * The value of the resource (URL or markdown content depending on kind).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "The resource value: a URL or markdown content depending on the kind.",
        },
    )
    @Column({
        name: "value",
        type: "text",
        nullable: true,
    })
        value: string | null

    /**
     * Display order within the category foundation list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the foundation list.",
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
    @Field(() => Int, { description: "Pure ordering index used to reorder the list (decoupled from orderIndex)." })
    @Column({ name: "sort_index", type: "int", default: 0 })
        sortIndex: number

    /**
     * Highlights this item as recommended in the category list.
     */
    @Field(
        () => Boolean,
        {
            description: "Whether this foundation item is marked as recommended.",
        },
    )
    @Column({
        name: "is_recommended",
        type: "boolean",
        default: false,
    })
        isRecommended: boolean

    /**
     * Author or source attribution for the resource.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Author or source attribution for the resource.",
        },
    )
    @Column({
        name: "author",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        author: string | null

    /**
     * Optional cover image URL for list/detail UI (e.g. YouTube playlist art).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional thumbnail or cover image URL.",
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
     * Default locale for this row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this foundation row.",
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
     * Parent category this foundation belongs to.
     */
    @Field(
        () => FoundationCategoryEntity,
        {
            description: "Parent category this foundation belongs to.",
        },
    )
    @ManyToOne(
        () => FoundationCategoryEntity,
        (category: FoundationCategoryEntity) => category.foundations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "category_id",
        foreignKeyConstraintName: "fk_category_id_foundations_categories",
    })
        category: FoundationCategoryEntity

    @Field(
        () => ID,
        {
            description: "Parent category ID.",
        },
    )
    @RelationId(
        (f: FoundationEntity) => f.category,
    )
        categoryId: string

    /**
     * Localized translations for fields such as `title`, `description`, `value`.
     */
    @Field(
        () => [FoundationTranslationEntity],
        {
            description: "Localized overrides for foundation fields.",
        },
    )
    @OneToMany(
        () => FoundationTranslationEntity,
        (translation: FoundationTranslationEntity) => translation.foundation,
        {
            cascade: true,
        },
    )
        translations: Array<FoundationTranslationEntity>

    /**
     * Tags for filtering and display (e.g. Docker, Video).
     */
    @Field(
        () => [FoundationTagEntity],
        {
            description: "Tags attached to this foundation item.",
        },
    )
    @OneToMany(
        () => FoundationTagEntity,
        (tag: FoundationTagEntity) => tag.foundation,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        tags: Array<FoundationTagEntity>
}
