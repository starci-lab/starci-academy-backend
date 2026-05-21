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
    CodeExplainingEntity,
} from "./code-explaining.entity"
import {
    CodeExplainingImplementationTranslationEntity,
} from "./code-explaining-implementation-translation.entity"

/**
 * Implementation guide for a code explaining snippet in a specific language (Go, C#, .NET, Java).
 */
@ObjectType({
    description: "Implementation guide for a code snippet in a specific programming language.",
})
@Entity("code_explaining_implementations")
export class CodeExplainingImplementationEntity extends UuidAbstractEntity {
    /**
     * Programming language (Go, C#, .NET, Java).
     */
    @Field(
        () => String,
        {
            description: "Programming language (Go, C#, .NET, Java).",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 64,
    })
        lang: string

    /**
     * Implementation guide with code block and explanation (Markdown).
     */
    @Field(
        () => String,
        {
            description: "Implementation guide with code block and explanation (Markdown).",
        },
    )
    @Column({
        name: "implement_guide",
        type: "text",
    })
        implementGuide: string

    /**
     * Display order within the code explaining implementation list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the code explaining implementation list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this implementation row.
     */
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

    /**
     * Parent code explaining this implementation belongs to.
     */
    @Field(
        () => CodeExplainingEntity,
        {
            description: "Parent code explaining this implementation belongs to.",
        },
    )
    @ManyToOne(
        () => CodeExplainingEntity,
        (codeExplaining: CodeExplainingEntity) => codeExplaining.implementations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "code_explaining_id",
        foreignKeyConstraintName:
            "fk_code_explaining_id_code_explaining_implementations_code_explainings",
    })
        codeExplaining: CodeExplainingEntity

    /**
     * Parent code explaining ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent code explaining ID.",
        },
    )
    @RelationId(
        (impl: CodeExplainingImplementationEntity) => impl.codeExplaining,
    )
        codeExplainingId: string

    /**
     * Localized overrides for implementation fields (implementGuide).
     */
    @Field(
        () => [CodeExplainingImplementationTranslationEntity],
        {
            description: "Localized overrides for implementation fields (implementGuide).",
        },
    )
    @OneToMany(
        () => CodeExplainingImplementationTranslationEntity,
        (translation: CodeExplainingImplementationTranslationEntity) => translation.codeExplainingImplementation,
        {
            cascade: true,
        },
    )
        translations: Array<CodeExplainingImplementationTranslationEntity>
}
