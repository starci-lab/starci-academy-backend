import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    Column,
    Entity,
    OneToMany,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ConceptSectionEntity,
} from "./concept-section.entity"
import {
    ConceptTranslationEntity,
} from "./concept-translation.entity"
import type {
    ConceptActivity,
    ConceptLearningOutcome,
    ConceptReference,
    ConceptWorkspace,
} from "@modules/init/seeders/concepts/types"

@ObjectType({
    description: "Independent concept lesson seeded from the concepts mount.",
})
@Entity("concepts")
/** A course-independent concept lesson with localized copy and ordered sections. */
export class ConceptEntity extends UuidAbstractEntity {
    @Field(() => String)
    @Column({
        name: "display_id", type: "varchar", length: 255, unique: true,
    })
        displayId: string

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

    @Field(() => String)
    @Column({
        name: "category", type: "varchar", length: 128,
    })
        category: string

    @Field(() => String)
    @Column({
        name: "difficulty", type: "varchar", length: 32,
    })
        difficulty: string

    @Field(() => Int)
    @Column({
        name: "minutes_read", type: "int", default: 0,
    })
        minutesRead: number

    @Field(() => String)
    @Column({
        name: "implementation", type: "varchar", length: 64,
    })
        implementation: string

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

    @Field(() => GraphQLJSON,
        {
            nullable: true,
        })
    @Column({
        name: "workspace", type: "jsonb", nullable: true,
    })
        workspace: ConceptWorkspace | null

    /** Root retrieval/grading records. Deliberately absent from GraphQL fields. */
    @Column({
        name: "activities", type: "jsonb", nullable: true,
    })
        activities: Array<ConceptActivity> | null

    @Field(() => [ConceptTranslationEntity])
    @OneToMany(
        () => ConceptTranslationEntity,
        (translation: ConceptTranslationEntity) => translation.concept,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<ConceptTranslationEntity>

    @Field(() => [ConceptSectionEntity])
    @OneToMany(
        () => ConceptSectionEntity,
        (section: ConceptSectionEntity) => section.concept,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        sections: Array<ConceptSectionEntity>
}
