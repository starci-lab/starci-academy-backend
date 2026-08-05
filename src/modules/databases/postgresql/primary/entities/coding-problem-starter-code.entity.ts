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
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CodingProblemEntity,
} from "./coding-problem.entity"

@ObjectType(
    "CodingProblemStarterCode",
    {
        description: "Editor starter/boilerplate code for a problem in one language.",
    },
)
@Entity("coding_problem_starter_codes")
@Unique(
    "uq_coding_problem_starter_codes_problem_language",
    ["problem",
        "language"],
)
/**
 * Boilerplate starter code shown in the editor for one (problem, language)
 * pair — e.g. the function signature the user fills in. One row per supported
 * language; uniqueness is enforced on (codingProblemId, language).
 */
export class CodingProblemStarterCodeEntity extends UuidAbstractEntity {
    @Field(
        () => GraphQLTypeCodingLanguage,
        {
            description: "Language this starter code is written in.",
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
            description: "Starter source code pre-filled into the editor.",
        },
    )
    @Column({
        name: "code",
        type: "text",
    })
        code: string

    @ManyToOne(
        () => CodingProblemEntity,
        (problem: CodingProblemEntity) => problem.starterCodes,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "coding_problem_id",
        foreignKeyConstraintName:
            "fk_coding_problem_id_coding_problem_starter_codes_coding_problems",
    })
        problem: CodingProblemEntity

    @Field(
        () => String,
        {
            description: "Foreign key to `coding_problems.id`.",
        },
    )
    @RelationId(
        (starterCode: CodingProblemStarterCodeEntity) => starterCode.problem,
    )
        codingProblemId: string
}
