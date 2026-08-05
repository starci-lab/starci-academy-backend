import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums/locale"
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
    CodeExplainingTranslationEntity,
} from "./code-explaining-translation.entity"

@ObjectType({
    description: "Critical code snippet attached to a content with explanation.",
})
@Entity("code_explainings")
/**
 * Critical code snippet attached to a content (lesson) with explanation.
 */
export class CodeExplainingEntity extends UuidAbstractEntity {
    /**
     * The critical code snippet from the lesson repository.
     */
    @Field(
        () => String,
        {
            description: "Critical code snippet from the lesson repository.",
        },
    )
    @Column({
        name: "code",
        type: "text",
    })
        code: string

    /**
     * Programming language of the code snippet (e.g. typescript, nginx, yaml).
     */
    @Field(
        () => String,
        {
            description: "Programming language of the code snippet.",
        },
    )
    @Column({
        name: "lang",
        type: "varchar",
        length: 64,
    })
        lang: string

    /**
     * Short explanation of why this code is critical (max 3 sentences).
     */
    @Field(
        () => String,
        {
            description: "Short explanation of why this code is critical.",
        },
    )
    @Column({
        name: "explain",
        type: "text",
    })
        explain: string

    /**
     * Display order within the content code explaining list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the content code explaining list.",
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
     * Default locale for this code explaining row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this code explaining row.",
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
     * Parent content this code explaining belongs to.
     */
    @Field(
        () => ContentEntity,
        {
            description: "Parent content this code explaining belongs to.",
        },
    )
    @ManyToOne(
        () => ContentEntity,
        (content: ContentEntity) => content.codeExplainings,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        foreignKeyConstraintName:
            "fk_content_id_code_explainings_contents",
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
        (codeExplaining: CodeExplainingEntity) => codeExplaining.content,
    )
        contentId: string

    /**
     * Localized overrides for code explaining fields (explain).
     */
    @Field(
        () => [CodeExplainingTranslationEntity],
        {
            description: "Localized overrides for code explaining fields (explain).",
        },
    )
    @OneToMany(
        () => CodeExplainingTranslationEntity,
        (translation: CodeExplainingTranslationEntity) => translation.codeExplaining,
        {
            cascade: true,
        },
    )
        translations: Array<CodeExplainingTranslationEntity>
}
