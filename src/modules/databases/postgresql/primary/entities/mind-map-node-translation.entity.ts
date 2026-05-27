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
    MindMapNodeEntity,
} from "./mind-map-node.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

/**
 * Translation entity for mind-map node fields.
 * Primary key: (nodeId, locale, field).
 *
 * Mirrors {@link ModuleTranslationEntity} so the same generic
 * key-value translation pattern works across the codebase.
 */
@ObjectType({
    description: "Localized value for a specific mind-map node field.",
})
@Entity("mind_map_node_translations")
export class MindMapNodeTranslationEntity extends AbstractEntity {
    @Field(
        () => String,
        {
            description: "Target mind-map node ID.",
        },
    )
    @PrimaryColumn({
        name: "node_id",
        type: "uuid",
    })
        nodeId: string

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
            description: "Target field name being translated (e.g. label).",
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
        () => MindMapNodeEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "node_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_node_id_mind_map_node_translations_mind_map_nodes",
    })
        node: MindMapNodeEntity
}
