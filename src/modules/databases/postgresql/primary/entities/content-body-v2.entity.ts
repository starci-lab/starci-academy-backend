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
    ContentBodyV2TranslationEntity,
} from "./content-body-v2-translation.entity"

/**
 * SCHEMA V2 per-programming-language lesson body for a content (mount `# bodies`). One row per
 * language; the markdown `body` holds the default locale and per-locale variants live in the
 * translation table. This replaces the earlier (wrong) overload of `codeImplementations` for the
 * lesson body — `codeImplementations` is back to its legacy meaning (code guide/example snippets).
 */
@ObjectType({
    description: "Per-language lesson body for a content (SCHEMA V2); per-locale text in the translation table.",
})
@Entity("content_bodies_v2")
export class ContentBodyV2Entity extends UuidAbstractEntity {
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
            description: "Display order within the content body V2 list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

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
        (content: ContentEntity) => content.bodiesV2,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_content_bodies_v2_contents",
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
        (contentBodyV2: ContentBodyV2Entity) => contentBodyV2.content,
    )
        contentId: string

    /**
     * Per-locale lesson body variants for this language.
     */
    @Field(
        () => [ContentBodyV2TranslationEntity],
        {
            description: "Per-locale lesson body variants for this language.",
        },
    )
    @OneToMany(
        () => ContentBodyV2TranslationEntity,
        (translation: ContentBodyV2TranslationEntity) => translation.contentBodyV2,
        {
            cascade: true,
        },
    )
        translations: Array<ContentBodyV2TranslationEntity>
}
