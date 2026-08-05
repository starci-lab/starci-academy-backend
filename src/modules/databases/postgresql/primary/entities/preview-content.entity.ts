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
    ModuleEntity,
} from "./module.entity"
import {
    PreviewContentTranslationEntity,
} from "./preview-content-translation.entity"

@ObjectType({
    description: "A preview content line item in a module.",
})
@Entity("preview_contents")
/**
 * A preview content line item in a module (typically bullet/paragraph data).
 */
export class PreviewContentEntity extends UuidAbstractEntity {
    /**
     * Content line text/body.
     */
    @Field(
        () => String,
        {
            description: "Content line text.",
        },
    )
    @Column({
        name: "text",
        type: "text",
    })
        text: string

    /**
     * Display order within the parent module preview content list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the parent module preview content list.",
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
     * Default locale for this preview content row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this preview content row.",
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
     * Parent module this preview content belongs to.
     */
    @Field(
        () => ModuleEntity,
        {
            description: "Parent module this preview content belongs to.",
        },
    )
    @ManyToOne(
        () => ModuleEntity,
        (module: ModuleEntity) => module.previewContents,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
        foreignKeyConstraintName:
            "fk_module_id_preview_contents_modules",
    })
        module: ModuleEntity

    /**
     * Parent module ID.
     */
    @Field(
        () => ID,
        {
            description: "Parent module ID.",
        },
    )
    @RelationId(
        (pc: PreviewContentEntity) => pc.module,
    )
        moduleId: string

    /**
     * Localized translations for fields such as `data`.
     */
    @Field(
        () => [PreviewContentTranslationEntity],
        {
            description: "Localized overrides for preview content fields (e.g. data).",
        },
    )
    @OneToMany(
        () => PreviewContentTranslationEntity,
        (previewContentTranslation: PreviewContentTranslationEntity) => previewContentTranslation.previewContent,
        {
            cascade: true,
        },
    )
        translations: Array<PreviewContentTranslationEntity>
}

