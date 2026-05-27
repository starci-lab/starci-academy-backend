import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
    Tree,
    TreeChildren,
    TreeParent,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CourseEntity,
} from "./course.entity"
import {
    MindMapNodeTranslationEntity,
} from "./mind-map-node-translation.entity"
import {
    GraphQLTypeLocale,
    GraphQLTypeMindMapNodeEntityType,
    Locale,
    MindMapNodeEntityType,
} from "../enums"

/**
 * Mind-map node belonging to a course's hierarchical mind-map.
 *
 * Hierarchy is materialized via a TypeORM closure table
 * (`mind_map_node_closure`) so ancestor / descendant lookups
 * are O(1) per row instead of recursive CTEs.
 *
 * Each node may optionally link to a real entity (module, lesson,
 * challenge) via {@link entityType} + {@link entityId} so the
 * frontend can navigate from a node click to the target page.
 */
@ObjectType({
    description: "A node in the hierarchical mind-map of a course.",
})
@Tree(
    "closure-table",
    {
        // TypeORM appends "_closure" to this name → final table is "mind_map_node_closure".
        closureTableName: "mind_map_node",
        ancestorColumnName: () => "ancestor_id",
        descendantColumnName: () => "descendant_id",
    },
)
@Entity("mind_map_nodes")
export class MindMapNodeEntity extends UuidAbstractEntity {
    /**
     * Default-locale label displayed on the node.
     */
    @Field(
        () => String,
        {
            description: "Default-locale label displayed on the node.",
        },
    )
    @Column({
        name: "label",
        type: "varchar",
        length: 255,
    })
        label: string

    /**
     * Optional color token (hex code, tailwind class, or palette key).
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional color token (hex code, tailwind class, or palette key).",
        },
    )
    @Column({
        name: "color",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        color: string | null

    /**
     * Display order among siblings under the same parent.
     */
    @Field(
        () => Int,
        {
            description: "Display order among siblings under the same parent.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Polymorphic target type referenced by {@link entityId}.
     * `null` when the node is purely decorative.
     */
    @Field(
        () => GraphQLTypeMindMapNodeEntityType,
        {
            nullable: true,
            description: "Polymorphic target type referenced by entityId (module / lesson / challenge / custom).",
        },
    )
    @Column({
        name: "entity_type",
        type: "enum",
        enum: MindMapNodeEntityType,
        enumName: "mind_map_node_entity_type",
        nullable: true,
    })
        entityType: MindMapNodeEntityType | null

    /**
     * Polymorphic ID of the referenced entity (module / lesson / challenge).
     * `null` when {@link entityType} is `Custom` or unset.
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Polymorphic ID of the referenced entity; null for decorative nodes.",
        },
    )
    @Column({
        name: "entity_id",
        type: "uuid",
        nullable: true,
    })
        entityId: string | null

    /**
     * Default locale for the node label when no translation applies.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for the node label when no translation applies.",
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
     * Parent course this mind-map node belongs to.
     */
    @Field(
        () => CourseEntity,
        {
            description: "Parent course this mind-map node belongs to.",
        },
    )
    @ManyToOne(
        () => CourseEntity,
        (course: CourseEntity) => course.mindMapNodes,
        {
            onDelete: "CASCADE",
            nullable: false,
        },
    )
    @JoinColumn({
        name: "course_id",
        foreignKeyConstraintName: "fk_course_id_mind_map_nodes_courses",
    })
        course: CourseEntity

    /**
     * Parent course ID (relation-id projection of {@link course}).
     */
    @Field(
        () => ID,
        {
            description: "Parent course ID.",
        },
    )
    @RelationId(
        (node: MindMapNodeEntity) => node.course,
    )
        courseId: string

    /**
     * Immediate parent node in the mind-map tree.
     * `null` for the root node of a course.
     */
    @TreeParent({
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "parent_id",
        foreignKeyConstraintName: "fk_parent_id_mind_map_nodes_mind_map_nodes",
    })
    @Index("idx_mind_map_nodes_parent_id")
        parent: MindMapNodeEntity | null

    /**
     * Parent node ID (relation-id projection of {@link parent}; `null` for roots).
     */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Parent mind-map node ID; null for the root node of the course.",
        },
    )
    @RelationId(
        (node: MindMapNodeEntity) => node.parent,
    )
        parentId: string | null

    /**
     * Direct children of this node.
     * Populated by TypeORM tree repositories (e.g. `findDescendantsTree`).
     */
    @Field(
        () => [MindMapNodeEntity],
        {
            nullable: true,
            description: "Direct children of this node (populated via tree repository).",
        },
    )
    @TreeChildren({
        cascade: true,
    })
        children: Array<MindMapNodeEntity>

    /**
     * Localized overrides for the node label.
     */
    @Field(
        () => [MindMapNodeTranslationEntity],
        {
            description: "Localized overrides for the node label.",
        },
    )
    @OneToMany(
        () => MindMapNodeTranslationEntity,
        (translation: MindMapNodeTranslationEntity) => translation.node,
        {
            cascade: true,
        },
    )
        translations: Array<MindMapNodeTranslationEntity>
}
