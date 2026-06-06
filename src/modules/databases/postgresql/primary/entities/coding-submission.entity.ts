import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    CodingLanguage,
    GraphQLTypeCodingLanguage,
    CodingVerdict,
    GraphQLTypeCodingVerdict,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    CodingProblemEntity,
} from "./coding-problem.entity"
import {
    UserEntity,
} from "./user.entity"

/**
 * One attempt by a user to solve a coding problem — the submitted source plus
 * the judging outcome. Created in `pending` state by the submit mutation, then
 * updated by the judging worker to a terminal verdict with timing/score detail.
 * Full history is retained (one row per submit).
 */
@ObjectType(
    "CodingSubmission",
    {
        description: "A user's coding-problem submission and its judging result.",
    },
)
@Entity("coding_submissions")
@Index(
    "idx_coding_submissions_user_problem",
    ["user",
        "problem"],
)
export class CodingSubmissionEntity extends UuidAbstractEntity {
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_coding_submissions_users",
    })
        user: UserEntity

    @Field(
        () => String,
        {
            description: "Foreign key to `users.id` — the submitter.",
        },
    )
    @RelationId(
        (submission: CodingSubmissionEntity) => submission.user,
    )
        userId: string

    @Field(
        () => CodingProblemEntity,
        {
            description: "The problem this submission targets.",
        },
    )
    @ManyToOne(
        () => CodingProblemEntity,
        (problem: CodingProblemEntity) => problem.submissions,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "coding_problem_id",
        foreignKeyConstraintName:
            "fk_coding_problem_id_coding_submissions_coding_problems",
    })
        problem: CodingProblemEntity

    @Field(
        () => String,
        {
            description: "Foreign key to `coding_problems.id`.",
        },
    )
    @RelationId(
        (submission: CodingSubmissionEntity) => submission.problem,
    )
        codingProblemId: string

    @Field(
        () => GraphQLTypeCodingLanguage,
        {
            description: "Language the solution was submitted in.",
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
            description: "The submitted source code.",
        },
    )
    @Column({
        name: "source_code",
        type: "text",
    })
        sourceCode: string

    @Field(
        () => GraphQLTypeCodingVerdict,
        {
            description: "Current/terminal judging verdict.",
        },
    )
    @Column({
        name: "verdict",
        type: "enum",
        enum: CodingVerdict,
        enumName: "coding_verdict",
        default: CodingVerdict.Pending,
    })
        verdict: CodingVerdict

    @Field(
        () => Int,
        {
            description: "Number of testcases that passed.",
        },
    )
    @Column({
        name: "passed_count",
        type: "int",
        default: 0,
    })
        passedCount: number

    @Field(
        () => Int,
        {
            description: "Total number of testcases evaluated.",
        },
    )
    @Column({
        name: "total_count",
        type: "int",
        default: 0,
    })
        totalCount: number

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Max wall/CPU time across testcases in milliseconds (null until judged).",
        },
    )
    @Column({
        name: "runtime_ms",
        type: "int",
        nullable: true,
    })
        runtimeMs: number | null

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Max memory across testcases in kilobytes (null until judged).",
        },
    )
    @Column({
        name: "memory_kb",
        type: "int",
        nullable: true,
    })
        memoryKb: number | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Compiler stderr / message when the verdict is CompileError.",
        },
    )
    @Column({
        name: "compile_output",
        type: "text",
        nullable: true,
    })
        compileOutput: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Serialized JSON array of per-testcase results (status, time, memory). Sample-only for hidden cases.",
        },
    )
    @Column({
        name: "per_case_results",
        type: "text",
        nullable: true,
    })
        perCaseResults: string | null

    // --- Anti-cheat / telemetry (internal; intentionally NOT exposed via @Field) ---

    @Column({
        name: "ip_address",
        type: "varchar",
        length: 64,
        nullable: true,
    })
        ipAddress: string | null

    @Column({
        name: "user_agent",
        type: "varchar",
        length: 512,
        nullable: true,
    })
        userAgent: string | null

    @Column({
        name: "device_fingerprint",
        type: "varchar",
        length: 256,
        nullable: true,
    })
        deviceFingerprint: string | null

    @Column({
        name: "client_telemetry",
        type: "text",
        nullable: true,
    })
        clientTelemetry: string | null

    @Column({
        name: "suspicion_score",
        type: "int",
        default: 0,
    })
        suspicionScore: number

    @Column({
        name: "flagged_for_review",
        type: "boolean",
        default: false,
    })
        flaggedForReview: boolean
}
