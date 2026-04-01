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
    UuidAbstractEntity,
} from "./abstract"
import {
    ModuleEntity,
} from "./module.entity"
import {
    PreviewContentTranslationEntity,
} from "./preview-content-translation.entity"

/**
 * A preview content line item in a module (typically bullet/paragraph data).
 */
@ObjectType({
    description: "A preview content line item in a module.",
})
@Entity("preview_contents")
export class PreviewContentEntity extends UuidAbstractEntity {
    /**
     * Content line text/body.
     */
    @Field(
        () => String,
        {
            description: "Content line text/body.",
        },
    )
    @Column({
        name: "data",
        type: "text",
    })
        data: string

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
    })
        module: ModuleEntity

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

