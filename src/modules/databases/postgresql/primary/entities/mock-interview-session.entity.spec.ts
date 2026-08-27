import {
    getMetadataArgsStorage,
} from "typeorm"
import {
    MockInterviewSessionEntity,
} from "./mock-interview-session.entity"

describe("MockInterviewSessionEntity",
    () => {
        it("declares the partial unique index that protects unfinished enrollment sessions",
            () => {
                const index = getMetadataArgsStorage().indices.find(
                    (candidate) => candidate.target === MockInterviewSessionEntity
                        && candidate.name === "uq_mock_interview_sessions_unfinished_enrollment",
                )

                expect(index).toBeDefined()
                expect(index?.unique).toBe(true)
                expect(index?.where).toBe(
                    "\"status\" IN ('in_progress', 'grading', 'grading_failed')",
                )
            })
    })
