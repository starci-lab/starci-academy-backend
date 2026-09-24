import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums/locale"
import {
    AbstractEntity,
} from "./abstract"
import {
    ConceptEntity,
} from "./concept.entity"
import type {
    ConceptActivity,
    ConceptLearningOutcome,
    ConceptReference,
} from "@modules/init/seeders/concepts/types"

@ObjectType({
    description: "Localized copy for a concept lesson.",
})
@Entity("concept_translations")
/** One complete localized projection of a concept's authored copy. */
export class ConceptTranslationEntity extends AbstractEntity {
    @Field(() => String)
    @PrimaryColumn({
        name: "concept_id", type: "uuid",
    })
        conceptId: string

    @Field(() => GraphQLTypeLocale)
    @PrimaryColumn({
        name: "locale", type: "enum", enum: Locale, enumName: "locale",
    })
        locale: Locale

    @Field(() => String)
    @Column({
        name: "title", type: "varchar", length: 500,
    })
        title: string

    @Field(() => String)
    @Column({
        name: "description", type: "text",
    })
        description: string

    @Field(() => String,
        {
            nullable: true,
        })
    @Column({
        name: "body", type: "text", nullable: true,
    })
        body: string | null

    @Field(() => GraphQLJSON,
        {
            nullable: true,
        })
    @Column({
        name: "learning_outcomes", type: "jsonb", nullable: true,
    })
        learningOutcomes: Array<ConceptLearningOutcome> | null

    @Field(() => GraphQLJSON,
        {
            nullable: true,
        })
    @Column({
        name: "prerequisites", type: "jsonb", nullable: true,
    })
        prerequisites: Array<ConceptLearningOutcome> | null

    @Field(() => GraphQLJSON,
        {
            nullable: true,
        })
    @Column({
        name: "references", type: "jsonb", nullable: true,
    })
        references: Array<ConceptReference> | null

    /** Localized root grading records; never exposed as a GraphQL entity field. */
    @Column({
        name: "activities", type: "jsonb", nullable: true,
    })
        activities: Array<ConceptActivity> | null

    @ManyToOne(
        () => ConceptEntity,
        (concept: ConceptEntity) => concept.translations,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "concept_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_concept_id_concept_translations_concepts",
    })
        concept: ConceptEntity
}
