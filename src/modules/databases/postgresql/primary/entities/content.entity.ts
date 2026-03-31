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
    JoinColumn,
    ManyToOne,
    OneToMany,
} from "typeorm"
import {
    StringAbstractEntity,
} from "./abstract"
import {
    ModuleEntity,
} from "./module.entity"
import {
    ContentTranslationEntity,
} from "./content-translation.entity"

/**
 * Content attached to a module (title + body).
 */
@ObjectType({
    description: "Content attached to a module.",
})
@Entity("contents")
export class ContentEntity extends StringAbstractEntity {
    /**
     * Content title.
     */
    @Field(
        () => String,
        {
            description: "Content title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 500,
    })
        title: string

    /**
     * Optional markdown body.
     */
    @Field(
        () => String,
        {
            description: "Markdown body content.",
        },
    )
    @Column({
        name: "body",
        type: "text",
    })
        body: string

    /**
     * Display order within the module content list.
     */
    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Default locale for this content row.
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Parent module this content belongs to.
     */
    @Field(() => ModuleEntity)
    @ManyToOne(
        () => ModuleEntity,
        (module: ModuleEntity) => module.contents,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
    })
        module: ModuleEntity

    /**
     * Localized translations for fields such as `title` and `body`.
     */
    @Field(
        () => [ContentTranslationEntity],
        {
            nullable: true,
        },
    )
    @OneToMany(
        () => ContentTranslationEntity,
        (contentTranslation: ContentTranslationEntity) => contentTranslation.content,
        {
            cascade: true,
        },
    )
        translations?: Array<ContentTranslationEntity>
}