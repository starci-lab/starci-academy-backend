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
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ConceptEntity,
} from "./concept.entity"
import {
    ConceptSectionTranslationEntity,
} from "./concept-section-translation.entity"
import type {
    ConceptActivity,
} from "@modules/init/seeders/concepts/types"

@ObjectType({
    description: "Ordered lesson section belonging to an independent concept.",
})
@Entity("concept_sections")
@Index("uq_concept_sections_concept_display_id",
    ["concept",
        "displayId"],
    {
        unique: true,
    })
/** A localized Markdown section; assessment keys remain internal JSONB. */
export class ConceptSectionEntity extends UuidAbstractEntity {
    @Field(() => String)
    @Column({
        name: "display_id", type: "varchar", length: 255,
    })
        displayId: string

    @Field(() => String)
    @Column({
        name: "title", type: "varchar", length: 500,
    })
        title: string

    @Field(() => String)
    @Column({
        name: "phase", type: "varchar", length: 32,
    })
        phase: string

    @Field(() => String)
    @Column({
        name: "body", type: "text",
    })
        body: string

    @Field(() => Int)
    @Column({
        name: "order_index", type: "int", default: 0,
    })
        orderIndex: number

    @Field(() => Int)
    @Column({
        name: "sort_index", type: "int", default: 0,
    })
        sortIndex: number

    /** Internal grading/simulation data. Deliberately absent from GraphQL fields. */
    @Column({
        name: "activities", type: "jsonb", nullable: true,
    })
        activities: Array<ConceptActivity> | null

    @ManyToOne(
        () => ConceptEntity,
        (concept: ConceptEntity) => concept.sections,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "concept_id",
        foreignKeyConstraintName: "fk_concept_id_concept_sections_concepts",
    })
        concept: ConceptEntity

    @Field(() => ID)
    @RelationId(
        (section: ConceptSectionEntity) => section.concept,
    )
        conceptId: string

    @Field(() => [ConceptSectionTranslationEntity])
    @OneToMany(
        () => ConceptSectionTranslationEntity,
        (translation: ConceptSectionTranslationEntity) => translation.section,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ConceptSectionTranslationEntity>
}
