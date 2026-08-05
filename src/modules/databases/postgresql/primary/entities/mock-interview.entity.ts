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
    MockInterviewTranslationEntity,
} from "./mock-interview-translation.entity"
import {
    MockInterviewLangEntity,
} from "./mock-interview-lang.entity"
import {
    MockInterviewChecklistEntity,
} from "./mock-interview-checklist.entity"

@Entity("mock_interviews")
// technical draw scopes by (course, reached module) + tier; behavioral by tier only
@Index("idx_mock_interviews_course_module",
    ["courseId",
        "moduleId"])
@Index("idx_mock_interviews_family_tier",
    ["family",
        "tier"])
/**
 * One authored MOCK-INTERVIEW question -- the static side of the static-prompt - live-response
 * split. Unlike a flashcard (a recall fact you read the answer to),
 * an interview question is an express/analyze-tier prompt the candidate answers
 * OUT LOUD, graded by AI against this row's AUTHORED `idealAnswer` + `rubric`
 * (no lesson-content RAG -- the authored answer IS the ground truth).
 *
 * Two FAMILIES share this table (routed by {@link family}):
 *  - `technical` -- grounded in a course/module (`courseId`/`moduleId` set),
 *    graded on technical substance; carries the rich `diagram`/`givenCodes`/
 *    `idealAnswer` fields per `kind`.
 *  - `behavioral` -- GLOBAL (no course/module -- universal EQ competencies),
 *    graded on STAR via `rubric` + `ownershipSignal`; no code/diagram.
 *
 * Seeded from `.mount` (technical: `courses/<c>/mock-interview/`; behavioral:
 * `mock-interview-eq/`) -- the DSL uses the SAME `# field`/separator grammar as
 * flashcards, so the shared `ExtractJsonFromMdService` parses it. List fields
 * (`rubric`/`followUps`/`hints`/`keywords`/`tags`) land as jsonb arrays;
 * `family`/`kind`/`tier` are varchar (never pg_enum -- same reasoning as
 * `mock_interview_sessions.mode`, avoids the synchronize enum-add trap).
 *
 * Bilingual override via {@link translations} ({@link MockInterviewTranslationEntity}) --
 * same house pattern as content/milestone/challenge, added alongside the rename
 * from `interview_questions`. Per-programming-language `givenCode` variants (for
 * questions grounded in a multi-lang module) live in {@link langs}
 * ({@link MockInterviewLangEntity}) -- the inline `givenCode`/`givenLang` columns
 * on this row stay as the single-language default; `langs` is populated only
 * when a question needs more than one language variant.
 */
export class MockInterviewEntity extends UuidAbstractEntity {
    /** `technical` | `behavioral` -- routes source, grading model + surfaced tools. */
    @Column({
        type: "varchar", length: 32 
    })
        family: string

    /** Cognitive frame -- theory/reasoning/scenario/debug/review/optimize/coding/design (technical) or behavioral/situational/culture (behavioral). */
    @Column({
        type: "varchar", length: 32 
    })
        kind: string

    /** junior | middle | senior -- drives draw pool + rubric strictness. */
    @Column({
        type: "varchar", length: 16, nullable: true 
    })
        tier: string | null

    /** The interview question the interviewer asks (read as-is / delivered naturally, never AI-reframed from a seed). */
    @Column({
        type: "text" 
    })
        prompt: string

    /** Authored model answer / outline -- the grading ground-truth (technical). Null for behavioral (no single ideal story). */
    @Column({
        name: "ideal_answer", type: "text", nullable: true 
    })
        idealAnswer: string | null

    /** The reasoning points that earn credit (`## N` items) -- the grading anchor. jsonb array of strings. */
    @Column({
        type: "jsonb", nullable: true 
    })
        rubric: Array<string> | null

    /** 1-3 probe questions the interviewer may ask next (AI picks per answer). jsonb array. */
    @Column({
        name: "follow_ups", type: "jsonb", nullable: true 
    })
        followUps: Array<string> | null

    /** Progressive hints the interviewer nudges with when the candidate is stuck. jsonb array. */
    @Column({
        type: "jsonb", nullable: true 
    })
        hints: Array<string> | null

    /** Coverage keywords (from the `:::chip` block) -- secondary grading signal. jsonb array. */
    @Column({
        type: "jsonb", nullable: true 
    })
        keywords: Array<string> | null

    /** Optional GIVEN diagram (mermaid) the candidate reasons over (technical `scenario`). */
    @Column({
        type: "text", nullable: true
    })
        diagram: string | null

    /** Optional GIVEN code (broken / to review) the candidate reads (technical `debug`/`review`/`optimize`). */
    @Column({
        name: "given_code", type: "text", nullable: true
    })
        givenCode: string | null

    /** Language of {@link givenCode} (e.g. "typescript"). */
    @Column({
        name: "given_lang", type: "varchar", length: 32, nullable: true
    })
        givenLang: string | null

    /** EQ competency being probed -- conflict/ownership/leadership/communication/growth (behavioral only). */
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

    /** Bilingual overrides for this row's translatable fields (see class doc). */
    @OneToMany(
        () => MockInterviewTranslationEntity,
        (translation: MockInterviewTranslationEntity) => translation.mockInterview,
        {
            cascade: true,
        },
    )
        translations: Array<MockInterviewTranslationEntity>

    /** Per-programming-language `givenCode` variants (see class doc). */
    @OneToMany(
        () => MockInterviewLangEntity,
        (lang: MockInterviewLangEntity) => lang.mockInterview,
        {
            cascade: true,
        },
    )
        langs: Array<MockInterviewLangEntity>

    /**
     * Coverage checkpoints -- the grading anchor that succeeds {@link rubric}. Each row
     * carries the structure a bare rubric string could not (dimension/critical/weight).
     */
    @OneToMany(
        () => MockInterviewChecklistEntity,
        (checklist: MockInterviewChecklistEntity) => checklist.mockInterview,
        {
            cascade: true,
        },
    )
        checklists: Array<MockInterviewChecklistEntity>
}
