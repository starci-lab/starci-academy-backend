import {
    Column,
    Entity,
    Index,
    OneToMany,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    InterviewQuestionGivenCodeEntity,
} from "./interview-question-given-code.entity"

/**
 * One authored MOCK-INTERVIEW question — the static side of the "đề tĩnh · phản
 * hồi sống" split. Unlike a flashcard (a recall fact you read the answer to),
 * an interview question is an express/analyze-tier prompt the candidate answers
 * OUT LOUD, graded by AI against this row's AUTHORED `idealAnswer` + `rubric`
 * (no lesson-content RAG — the authored answer IS the ground truth).
 *
 * Two FAMILIES share this table (routed by {@link family}):
 *  - `technical` — grounded in a course/module (`courseId`/`moduleId` set),
 *    graded on technical substance; carries the rich `diagram`/`givenCodes`/
 *    `idealAnswer` fields per `kind`.
 *  - `behavioral` — GLOBAL (no course/module — universal EQ competencies),
 *    graded on STAR via `rubric` + `ownershipSignal`; no code/diagram.
 *
 * Seeded from `.mount` (technical: `courses/<c>/mock-interview/`; behavioral:
 * `mock-interview-eq/`) — the DSL uses the SAME `# field`/separator grammar as
 * flashcards, so the shared `ExtractJsonFromMdService` parses it. List fields
 * (`rubric`/`followUps`/`hints`/`keywords`/`tags`) land as jsonb arrays;
 * `family`/`kind`/`tier` are varchar (never pg_enum — same reasoning as
 * `mock_interview_sessions.mode`, avoids the synchronize enum-add trap).
 */
@Entity("interview_questions")
// technical draw scopes by (course, reached module) + tier; behavioral by tier only
@Index("idx_interview_questions_course_module",
    ["courseId",
        "moduleId"])
@Index("idx_interview_questions_family_tier",
    ["family",
        "tier"])
export class InterviewQuestionEntity extends UuidAbstractEntity {
    /** `technical` | `behavioral` — routes source, grading model + surfaced tools. */
    @Column({
        type: "varchar", length: 32 
    })
        family: string

    /** Cognitive frame — theory/reasoning/scenario/debug/review/optimize/coding/design (technical) or behavioral/situational/culture (behavioral). */
    @Column({
        type: "varchar", length: 32 
    })
        kind: string

    /** junior | middle | senior — drives draw pool + rubric strictness. */
    @Column({
        type: "varchar", length: 16, nullable: true 
    })
        tier: string | null

    /** The interview question the interviewer asks (read as-is / delivered naturally, never AI-reframed from a seed). */
    @Column({
        type: "text" 
    })
        prompt: string

    /** Authored model answer / outline — the grading ground-truth (technical). Null for behavioral (no single ideal story). */
    @Column({
        name: "ideal_answer", type: "text", nullable: true 
    })
        idealAnswer: string | null

    /** The reasoning points that earn credit (`## N` items) — the grading anchor. jsonb array of strings. */
    @Column({
        type: "jsonb", nullable: true 
    })
        rubric: Array<string> | null

    /** 1–3 probe questions the interviewer may ask next (AI picks per answer). jsonb array. */
    @Column({
        name: "follow_ups", type: "jsonb", nullable: true 
    })
        followUps: Array<string> | null

    /** Progressive hints the interviewer nudges with when the candidate is stuck. jsonb array. */
    @Column({
        type: "jsonb", nullable: true 
    })
        hints: Array<string> | null

    /** Coverage keywords (from the `:::chip` block) — secondary grading signal. jsonb array. */
    @Column({
        type: "jsonb", nullable: true 
    })
        keywords: Array<string> | null

    /** Optional GIVEN diagram (mermaid) the candidate reasons over (technical `scenario`). */
    @Column({
        type: "text", nullable: true 
    })
        diagram: string | null

    /**
     * Optional GIVEN code (broken / to review) the candidate reads (technical
     * `debug`/`review`/`optimize`) — one row per authored programming-language
     * variant (up to the 4 in `DEFAULT_PROGRAMMING_LANGUAGES`), same conceptual
     * bug/snippet in each. Empty array for every other `kind`.
     */
    @OneToMany(
        () => InterviewQuestionGivenCodeEntity,
        (givenCode: InterviewQuestionGivenCodeEntity) => givenCode.question,
        {
            cascade: true,
        },
    )
        givenCodes: Array<InterviewQuestionGivenCodeEntity>

    /** EQ competency being probed — conflict/ownership/leadership/communication/growth (behavioral only). */
    @Column({
        type: "varchar", length: 48, nullable: true 
    })
        competency: string | null

    /** Grading note that forces the AI to score the "I" vs "we" ownership signal (behavioral only). */
    @Column({
        name: "ownership_signal", type: "text", nullable: true 
    })
        ownershipSignal: string | null

    /** Free-form topic tags. jsonb array. */
    @Column({
        type: "jsonb", nullable: true 
    })
        tags: Array<string> | null

    /** Course this question belongs to (technical); NULL for global behavioral bank. */
    @Column({
        name: "course_id", type: "uuid", nullable: true 
    })
        courseId: string | null

    /** Module this question is scoped to for progress-aware draw (technical); NULL for global behavioral bank. */
    @Column({
        name: "module_id", type: "uuid", nullable: true 
    })
        moduleId: string | null

    /** The bank folder slug this came from (e.g. "0-nestjs-core-and-lifecycle", "0-core"). */
    @Column({
        name: "bank_slug", type: "varchar", length: 255 
    })
        bankSlug: string

    /** Stable display id (question folder slug). */
    @Column({
        name: "display_id", type: "varchar", length: 255, nullable: true 
    })
        displayId: string | null

    /** Display/draw order within its bank. */
    @Column({
        name: "sort_index", type: "int", default: 0 
    })
        sortIndex: number

    /** Premium gate (first ~20% free, like flashcards). */
    @Column({
        name: "is_premium", type: "boolean", default: false 
    })
        isPremium: boolean

    /** Locale the authored content is in (varchar to stay enum-trap-free). */
    @Column({
        name: "default_locale", type: "varchar", length: 8, default: "vi" 
    })
        defaultLocale: string
}
