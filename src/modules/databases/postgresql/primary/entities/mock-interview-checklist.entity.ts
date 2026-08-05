import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    MockInterviewEntity,
} from "./mock-interview.entity"

@Entity("mock_interview_checklists")
@Index("idx_mock_interview_checklists_interview",
    ["mockInterview"])
@Index("uq_mock_interview_checklists_interview_order",
    ["mockInterview",
        "orderIndex"],
    {
        unique: true,
    })
/**
 * One coverage CHECKPOINT of a {@link MockInterviewEntity} -- the grading anchor that
 * succeeds the parent's flat `rubric` jsonb array.
 *
 * A checkpoint states, declaratively, one thing a complete answer establishes ("a
 * per-handler try/catch bypasses the centralized error layer..."), as opposed to `rubric`'s
 * grader-facing phrasing ("points out that..."). It gets its own table rather than another
 * jsonb array because a checkpoint carries structure the grader scores against --
 * {@link dimension}, {@link critical}, {@link weight} -- which a bare string cannot hold;
 * the old rubric smuggled the dimension in as a `[technical]` text prefix.
 *
 * Authored as `# checklist` -> `## N` -> `### text` / `### dimension` / `### critical` /
 * `### weight`, mirroring how `# langs` authors {@link MockInterviewLangEntity}.
 *
 * English-only in both locales (same as `keywords`/`tags`), so unlike the lang variants
 * there is no translation child table.
 */
export class MockInterviewChecklistEntity extends UuidAbstractEntity {
    /** The checkpoint itself -- a declarative statement of what a complete answer establishes. */
    @Column({
        name: "text",
        type: "text",
    })
        text: string

    /**
     * Which axis this checkpoint scores on -- `technical` | `problemSolving` |
     * `communication` | `testing`. Varchar rather than a pg enum (same synchronize
     * enum-add trap the parent avoids for `family`/`kind`).
     */
    @Column({
        name: "dimension",
        type: "varchar",
        length: 32,
        nullable: true,
    })
        dimension: string | null

    /** A must-hit point: missing it should sink the answer, not merely cost partial credit. */
    @Column({
        name: "critical",
        type: "boolean",
        default: false,
    })
        critical: boolean

    /**
     * Points this checkpoint is worth. The scoreBands of one question's checkpoints SUM
     * TO 100, so a graded answer's score is just the sum of the bands it covered -- no
     * normalising a relative-weight total at grade time, and the authored allocation is
     * readable on its own ("this point is worth 25 of the 100").
     */
    @Column({
        name: "score_band",
        type: "int",
        default: 0,
    })
        scoreBand: number

    /** Zero-based authored ordinal (`## N`). */
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /** Pure ordering index used to reorder the list (decoupled from orderIndex). */
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /** Mock-interview question this checkpoint belongs to. */
    @ManyToOne(
        () => MockInterviewEntity,
        (mockInterview: MockInterviewEntity) => mockInterview.checklists,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "mock_interview_id",
        foreignKeyConstraintName: "fk_mi_checklists_mi",
    })
        mockInterview: MockInterviewEntity

    @RelationId(
        (checklist: MockInterviewChecklistEntity) => checklist.mockInterview,
    )
        mockInterviewId: string
}
