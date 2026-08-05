import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CodingProblemEntity,
} from "./coding-problem.entity"

@ObjectType(
    "CodingProblemTestcase",
    {
        description: "An input/expected-output pair used to judge a coding submission.",
    },
)
@Entity("coding_problem_testcases")
/**
 * A single testcase for a coding problem: one stdin fed to the user's program
 * and the exact stdout it must produce. `isSample` testcases are shown to the
 * user (to illustrate the problem); the rest are hidden and used only for
 * judging — they must never be exposed through non-admin GraphQL fields.
 */
export class CodingProblemTestcaseEntity extends UuidAbstractEntity {
    @Field(
        () => String,
        {
            description: "Standard input fed to the program for this testcase.",
        },
    )
    @Column({
        name: "input",
        type: "text",
    })
        input: string

    @Field(
        () => String,
        {
            description: "Exact expected standard output (compared after trailing-whitespace trim).",
        },
    )
    @Column({
        name: "expected_output",
        type: "text",
    })
        expectedOutput: string

    @Field(
        () => Boolean,
        {
            description: "Whether this testcase is a public sample (shown to the user) vs hidden (judging only).",
        },
    )
    @Column({
        name: "is_sample",
        type: "boolean",
        default: false,
    })
        isSample: boolean

    @Field(
        () => Int,
        {
            description: "Display/evaluation order within the problem's testcases (ascending).",
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

    @ManyToOne(
        () => CodingProblemEntity,
        (problem: CodingProblemEntity) => problem.testcases,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "coding_problem_id",
        foreignKeyConstraintName:
            "fk_coding_problem_id_coding_problem_testcases_coding_problems",
    })
        problem: CodingProblemEntity

    @Field(
        () => String,
        {
            description: "Foreign key to `coding_problems.id`.",
        },
    )
    @RelationId(
        (testcase: CodingProblemTestcaseEntity) => testcase.problem,
    )
        codingProblemId: string
}
