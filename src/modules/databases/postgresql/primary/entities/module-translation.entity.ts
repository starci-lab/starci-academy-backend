import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ModuleEntity,
} from "./module.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity storing localized values for module fields.
 *
 * Each row represents:
 * (moduleId, locale, field) -> translated value
 */
@ObjectType({
    description: "Localized value for a specific module field.",
})
@Entity("module_translations")
@Index(
    "uq_module_translation",
    [
        "moduleId",
        "locale",
        "field",
    ],
    {
        unique: true,
    },
)
export class ModuleTranslationEntity extends UuidAbstractEntity {
    /**
     * Target module ID.
     */
    @Field(
        () => String,
        {
            description: "Target module ID.",
        },
    )
    @Column({
        name: "module_id",
        type: "varchar",
        length: 255,
    })
        moduleId: string

    /**
     * Locale of the translation (e.g., vi, en).
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /**
     * Target field name being translated (e.g., title, description).
     */
    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @Column({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /**
     * Translated value for the field.
     */
    @Field(
        () => String,
        {
            description: "Translated value for the field.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    /**
     * Reference to the parent module.
     * Cascade delete ensures translations are removed when module is deleted.
     */
    @ManyToOne(
        () => ModuleEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
        referencedColumnName: "id",
    })
        module: ModuleEntity
}

