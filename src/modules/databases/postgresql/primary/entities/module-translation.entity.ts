import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractEntity,
} from "./abstract"
import {
    ModuleEntity,
} from "./module.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity for module fields.
 * Primary key: (moduleId, locale, field).
 */
@ObjectType({
    description: "Localized value for a specific module field.",
})
@Entity("module_translations")
export class ModuleTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target module ID.",
        },
    )
    @PrimaryColumn({
        name: "module_id",
        type: "uuid",
    })
        moduleId: string

    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation (e.g. vi, en).",
        },
    )
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

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

    @ManyToOne(
        () => ModuleEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "module_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_module_id_module_translations_modules",
    })
        module: ModuleEntity
}
