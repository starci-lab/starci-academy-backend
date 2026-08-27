import {
    getMetadataArgsStorage
} from "typeorm"
import {
    FlashcardQuizSessionEntity
} from "./flashcard-quiz-session.entity"

describe("FlashcardQuizSessionEntity cloze columns",
    () => {
        it("maps the approved v1 persistence fields",
            () => {
                const columns = getMetadataArgsStorage().columns
                    .filter(({ target }) => target === FlashcardQuizSessionEntity)
                    .map(({ options }) => options.name)
                expect(columns).toEqual(expect.arrayContaining([
                    "contract_version",
                    "start_request_id",
                    "start_request_fingerprint",
                    "quiz_items",
                    "answer_state",
                    "answer_version",
                    "score_snapshot",
                    "invalid_reason",
                ]))
            })

        it("keeps the cloze integrity constraints in synchronize metadata",
            () => {
                const checks = getMetadataArgsStorage().checks
                    .filter(({ target }) => target === FlashcardQuizSessionEntity)
                expect(checks).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        name: "chk_flashcard_quiz_v1_shape",
                        expression: expect.stringContaining("jsonb_array_length(\"quiz_items\") > 0"),
                    }),
                    expect.objectContaining({
                        name: "chk_flashcard_quiz_v1_completed_score",
                        expression: expect.stringContaining("\"score_snapshot\" IS NOT NULL"),
                    }),
                ]))
            })

        it("keeps the cloze idempotency indexes in synchronize metadata",
            () => {
                const indices = getMetadataArgsStorage().indices
                    .filter(({ target }) => target === FlashcardQuizSessionEntity)
                expect(indices).toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        name: "uq_flashcard_quiz_active_enrollment",
                        columns: [
                            "enrollmentId",
                        ],
                        unique: true,
                        where: "status = 'in_progress'",
                    }),
                    expect.objectContaining({
                        name: "uq_flashcard_quiz_start_request",
                        columns: [
                            "enrollmentId",
                            "startRequestId",
                        ],
                        unique: true,
                        where: "start_request_id IS NOT NULL",
                    }),
                ]))
            })
    })
