import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    OneToMany,
} from "typeorm"
import {
    CodingDifficulty,
    CodingDomain,
    GraphQLTypeCodingDifficulty,
    GraphQLTypeCodingDomain,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CodingProblemTranslationEntity,
} from "./coding-problem-translation.entity"
import {
    CodingProblemTestcaseEntity,
} from "./coding-problem-testcase.entity"
import {
    CodingProblemStarterCodeEntity,
} from "./coding-problem-starter-code.entity"
import {
    CodingProblemSolutionEntity,
} from "./coding-problem-solution.entity"
import {
    CodingSubmissionEntity,
} from "./coding-submission.entity"

/**
 * A LeetCode-style coding-practice problem. Admin-authored (seeded from
 * `.mount/data/coding-problems/`). The default `title`/`statement` are the
 * English source; per-locale overrides live in {@link CodingProblemTranslationEntity}.
 */
@ObjectType(
    "CodingProblem",
    {
        description: "A coding-practice problem with testcases and starter code.",
    },
)
@Entity("coding_problems")
export class CodingProblemEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Stable URL slug, unique across problems (e.g. `two-sum`).",
        },
    )
    @Column({
        name: "slug",
        type: "varchar",
        length: 200,
        unique: true,
    })
        slug: string

    @Field(
        () => GraphQLTypeCodingDifficulty,
        {
            description: "Difficulty tier of the problem.",
        },
    )
    @Column({
        name: "difficulty",
        type: "enum",
        enum: CodingDifficulty,
        enumName: "coding_difficulty",
    })
        difficulty: CodingDifficulty

    @Field(
        () => GraphQLTypeCodingDomain,
        {
            description: "Primary interview topic domain (used to group the problem list).",
        },
    )
    @Column({
        name: "domain",
        type: "enum",
        enum: CodingDomain,
        enumName: "coding_domain",
        default: CodingDomain.Arrays,
    })
        domain: CodingDomain

    @Field(
        () => String,
        {
            description: "Default (English) problem title.",
        },
    )
    @Column({
        name: "title",
        type: "varchar",
        length: 300,
    })
        title: string

    @Field(
        () => String,
        {
            description: "Default (English) problem statement in Markdown.",
        },
    )
    @Column({
        name: "statement",
        type: "text",
    })
        statement: string

    @Field(
        () => [String],
        {
            description: "Topic tags for filtering (e.g. `array`, `dp`, `graph`).",
        },
    )
    @Column({
        name: "tags",
        type: "text",
        array: true,
        default: () => "'{}'",
    })
        tags: Array<string>

    @Field(
        () => Int,
        {
            description: "Per-run CPU time limit in milliseconds (applied to every testcase).",
        },
    )
    @Column({
        name: "time_limit_ms",
        type: "int",
        default: 2000,
    })
        timeLimitMs: number

    @Field(
        () => Int,
        {
            description: "Per-run memory limit in kilobytes (applied to every testcase).",
        },
    )
    @Column({
        name: "memory_limit_kb",
        type: "int",
        default: 262144,
    })
        memoryLimitKb: number

    @Field(
        () => Int,
        {
            description: "Points awarded for a first clean solve (by difficulty: easy 10 / medium 15 / hard 20).",
        },
    )
    @Column({
        name: "points",
        type: "int",
        default: 10,
    })
        points: number

    @Field(
        () => Int,
        {
            description: "Display order within the problem list (ascending).",
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
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex)." 
        })
    @Column({
        name: "sort_index", type: "int", default: 0 
    })
        sortIndex: number

    @Field(
        () => Boolean,
        {
            description: "Whether the problem is visible/listable to users.",
        },
    )
    @Column({
        name: "enabled",
        type: "boolean",
        default: true,
    })
        enabled: boolean

    @Field(
        () => [CodingProblemTranslationEntity],
        {
            nullable: true,
            description: "Per-locale overrides for translatable fields (title, statement).",
        },
    )
    @OneToMany(
        () => CodingProblemTranslationEntity,
        (translation: CodingProblemTranslationEntity) => translation.problem,
        {
            cascade: true,
        },
    )
        translations: Array<CodingProblemTranslationEntity>

    @Field(
        () => [CodingProblemTestcaseEntity],
        {
            nullable: true,
            description: "Testcases for the problem. Hidden testcases are never exposed to non-admin users.",
        },
    )
    @OneToMany(
        () => CodingProblemTestcaseEntity,
        (testcase: CodingProblemTestcaseEntity) => testcase.problem,
        {
            cascade: true,
        },
    )
        testcases: Array<CodingProblemTestcaseEntity>

    @Field(
        () => [CodingProblemStarterCodeEntity],
        {
            nullable: true,
            description: "Starter (boilerplate) code per supported language.",
        },
    )
    @OneToMany(
        () => CodingProblemStarterCodeEntity,
        (starterCode: CodingProblemStarterCodeEntity) => starterCode.problem,
        {
            cascade: true,
        },
    )
        starterCodes: Array<CodingProblemStarterCodeEntity>

    /**
     * Full reference solutions per language (the worked answer). NOT a GraphQL
     * field: solutions must never be served through the `codingProblem` detail
     * read — they are gated behind the reveal flow ({@link CodingProblemSolutionEntity}).
     * Kept as a DB relation only (seeding/internal reads).
     */
    @OneToMany(
        () => CodingProblemSolutionEntity,
        (solution: CodingProblemSolutionEntity) => solution.problem,
        {
            cascade: true,
        },
    )
        solutions: Array<CodingProblemSolutionEntity>

    @OneToMany(
        () => CodingSubmissionEntity,
        (submission: CodingSubmissionEntity) => submission.problem,
    )
        submissions: Array<CodingSubmissionEntity>
}
