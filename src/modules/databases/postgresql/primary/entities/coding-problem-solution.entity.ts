import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    CodingLanguage,
    GraphQLTypeCodingLanguage,
} from "../enums/coding-language"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CodingProblemEntity,
} from "./coding-problem.entity"

@ObjectType(
    "CodingProblemSolution",
    {
        description: "Full reference solution for a problem in one language.",
    },
)
@Entity("coding_problem_solutions")
@Unique(
    "uq_coding_problem_solutions_problem_language",
    ["problem",
        "language"],
)
/**
 * Full reference solution for one (problem, language) pair -- the worked answer a
 * learner can reveal in their language of choice. One row per supported language;
 * uniqueness is enforced on (codingProblemId, language).
 */
export class CodingProblemSolutionEntity extends UuidAbstractEntity {
    @Field(
        () => GraphQLTypeCodingLanguage,
        {
            description: "Language this solution is written in.",
        },
    )
    @Column({
        name: "language",
        type: "enum",
        enum: CodingLanguage,
        enumName: "coding_language",
    })
        language: CodingLanguage

    @Field(
        () => String,
        {
            description: "Full reference solution source code.",
        },
    )
    @Column({
        name: "code",
        type: "text",
    })
        code: string

    @ManyToOne(
        () => CodingProblemEntity,
        (problem: CodingProblemEntity) => problem.solutions,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "coding_problem_id",
        foreignKeyConstraintName:
            "fk_coding_problem_id_coding_problem_solutions_coding_problems",
    })
        problem: CodingProblemEntity

    @Field(
        () => String,
        {
            description: "Foreign key to `coding_problems.id`.",
        },
    )
    @RelationId(
        (solution: CodingProblemSolutionEntity) => solution.problem,
    )
        codingProblemId: string
}
