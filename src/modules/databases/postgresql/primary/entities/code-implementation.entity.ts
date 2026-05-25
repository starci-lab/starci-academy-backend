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
    CodeImplementationTranslationEntity,
} from "./code-implementation-translation.entity"

/**
 * Multi-language implementation guide for a lesson (mount `# codeImplementations`).
 */
@ObjectType({
    description: "Implementation guide for a content lesson in a specific programming language.",
})
@Entity("code_implementations")
export class CodeImplementationEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Programming language (e.g. csharp, go, java).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 64,
    })
        lang: string

    @Field(
        () => String,
        {
            description: "Mapping guide prose (Markdown).",
        },
    )
    @Column({
        name: "guide",
        type: "text",
    })
        guide: string

    @Field(
        () => String,
        {
            description: "Example code block (Markdown).",
        },
    )
    @Column({
        name: "example",
        type: "text",
    })
        example: string

    @Field(
        () => Int,
        {
            description: "Display order within the content implementation list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this implementation row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    @Field(
        () => ContentEntity,
        {
            description: "Parent content this implementation belongs to.",
        },
    )
    @ManyToOne(
        () => ContentEntity,
        (content: ContentEntity) => content.codeImplementations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName: "fk_content_id_code_implementations_contents",
    })
        content: ContentEntity

    @Field(
        () => ID,
        {
            description: "Parent content ID.",
        },
    )
    @RelationId(
        (implementation: CodeImplementationEntity) => implementation.content,
    )
        contentId: string

    @Field(
        () => [CodeImplementationTranslationEntity],
        {
            description: "Localized overrides for guide and example.",
        },
    )
    @OneToMany(
        () => CodeImplementationTranslationEntity,
        (translation: CodeImplementationTranslationEntity) => translation.codeImplementation,
        {
            cascade: true,
        },
    )
        translations: Array<CodeImplementationTranslationEntity>
}
