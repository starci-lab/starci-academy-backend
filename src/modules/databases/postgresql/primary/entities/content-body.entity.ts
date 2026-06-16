import {
    Field,
    ID,
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
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ContentEntity,
} from "./content.entity"
import {
    ContentBodyTranslationEntity,
} from "./content-body-translation.entity"

/**
 * SCHEMA V2 per-programming-language lesson body for a content (mount `bodies/<N>-<lang>/`).
 * One row per language; the markdown `body` holds the default locale and per-locale variants
 * live in the translation table.
 */
@ObjectType({
    description: "Per-language lesson body for a content (SCHEMA V2); per-locale text in the translation table.",
})
@Entity("content_bodies")
export class ContentBodyEntity extends UuidAbstractEntity {
    /**
     * Programming language for this body (e.g. typescript, java, csharp, go).
     */
    @Field(
        () => String,
        {
            description: "Programming language for this lesson body (typescript, java, csharp, go).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 64,
    })
        lang: string

    /**
     * Display order (doubles as the language index).
     */
    @Field(
        () => Int,
        {
            description: "Display order within the content body list.",
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
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex).",
        })
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /**
     * Default-locale lesson body (Markdown); per-locale variants live in {@link translations}.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Default-locale lesson body (Markdown).",
        },
    )
    @Column({
        name: "body",
        type: "text",
        nullable: true,
    })
        body: string | null

    /**
     * Default locale for this body row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this lesson body row.",
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
     * Parent content this body belongs to.
     */
    @ManyToOne(
        () => ContentEntity,
        (content: ContentEntity) => content.bodies,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_content_bodies_contents",
    })
        content: ContentEntity

    /**
     * Parent content ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent content ID.",
        },
    )
    @RelationId(
        (contentBody: ContentBodyEntity) => contentBody.content,
    )
        contentId: string

    /**
     * Per-locale lesson body variants for this language.
     */
    @Field(
        () => [ContentBodyTranslationEntity],
        {
            description: "Per-locale lesson body variants for this language.",
        },
    )
    @OneToMany(
        () => ContentBodyTranslationEntity,
        (translation: ContentBodyTranslationEntity) => translation.contentBody,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ContentBodyTranslationEntity>
}
