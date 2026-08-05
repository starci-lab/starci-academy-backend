import {
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
    Unique,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"
import {
    CodingProblemEntity,
} from "./coding-problem.entity"

@Entity("coding_solution_reveals")
@Unique(
    "uq_coding_solution_reveals_user_problem",
    ["user",
        "problem"],
)
/**
 * Records that a user revealed a problem's reference solution. Used to gate the
 * coding-points award: a problem only awards points on a first clean solve when
 * NO reveal row exists for (user, problem) at award time — i.e. the user did not
 * peek at the answer before solving. One row per (user, problem).
 *
 * Internal bookkeeping only — not exposed via GraphQL.
 */
export class CodingSolutionRevealEntity extends UuidAbstractEntity {
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName:
            "fk_user_id_coding_solution_reveals_users",
    })
        user: UserEntity

    /** Foreign key to `users.id`. */
    @RelationId(
        (reveal: CodingSolutionRevealEntity) => reveal.user,
    )
        userId: string

    @ManyToOne(
        () => CodingProblemEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "coding_problem_id",
        foreignKeyConstraintName:
            "fk_coding_problem_id_coding_solution_reveals_coding_problems",
    })
        problem: CodingProblemEntity

    /** Foreign key to `coding_problems.id`. */
    @RelationId(
        (reveal: CodingSolutionRevealEntity) => reveal.problem,
    )
        codingProblemId: string
}
