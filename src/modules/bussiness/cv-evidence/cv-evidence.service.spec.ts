import {
    CvEvidenceLevel,
} from "@modules/databases/postgresql/primary/enums/cv-evidence-level"
import {
    CvEvidenceSelectionInvalidException,
} from "@modules/platform/exceptions/errors/cv/cv-evidence-selection-invalid"
import {
    makeEntityManagerMock,
    asEntityManager,
} from "@tests/mocks/entity-manager.mock"
import {
    CvEvidenceService,
} from "./cv-evidence.service"

const row = (overrides: Record<string, unknown> = {
}) => ({
    milestone_task_attempt_id: "attempt-1",
    milestone_task_id: "task-1",
    milestone_id: "milestone-1",
    course_id: "course-1",
    task_title: "Build an API",
    milestone_title: "Backend capstone",
    course_title: "Fullstack Master",
    score: "92",
    passed_at: new Date("2026-08-01T00:00:00.000Z"),
    passed: true,
    user_id: "user-1",
    ...overrides,
})

describe("CvEvidenceService",
    () => {
        it("lists caller-owned passed capstones as immutable snapshot data",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.query.mockResolvedValue([row()])
                const service = new CvEvidenceService(asEntityManager(entityManager))

                await expect(service.listPickable({
                    userId: "user-1" 
                })).resolves.toEqual([{
                    milestoneTaskAttemptId: "attempt-1",
                    milestoneTaskId: "task-1",
                    milestoneId: "milestone-1",
                    courseId: "course-1",
                    taskTitle: "Build an API",
                    milestoneTitle: "Backend capstone",
                    courseTitle: "Fullstack Master",
                    score: 92,
                    passedAt: "2026-08-01T00:00:00.000Z",
                }])
                expect(entityManager.query).toHaveBeenCalledWith(
                    expect.stringContaining("e.user_id = $1"),
                    ["user-1"],
                )
            })

        it("accepts an empty selection without querying",
            async () => {
                const entityManager = makeEntityManagerMock()
                const service = new CvEvidenceService(asEntityManager(entityManager))

                await expect(service.resolveSelected({
                    userId: "user-1",
                    milestoneTaskAttemptIds: [],
                })).resolves.toEqual({
                    snapshot: [] 
                })
                expect(entityManager.query).not.toHaveBeenCalled()
            })

        it("preserves request order after validating ownership and pass state",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.query.mockResolvedValue([
                    row(),
                    row({
                        milestone_task_attempt_id: "attempt-2", task_title: "Ship UI" 
                    }),
                ])
                const service = new CvEvidenceService(asEntityManager(entityManager))

                const result = await service.resolveSelected({
                    userId: "user-1",
                    milestoneTaskAttemptIds: ["attempt-2",
                        "attempt-1"],
                })

                expect(result.snapshot.map((item) => item.milestoneTaskAttemptId)).toEqual([
                    "attempt-2",
                    "attempt-1",
                ])
            })

        it.each([
            ["duplicate",
                ["attempt-1",
                    "attempt-1"],
                []],
            ["foreign",
                ["attempt-1"],
                [row({
                    user_id: "user-2" 
                })]],
            ["failed",
                ["attempt-1"],
                [row({
                    passed: false 
                })]],
            ["missing",
                ["attempt-1"],
                []],
        ])("rejects %s selections atomically",
            async (_name, ids, rows) => {
                const entityManager = makeEntityManagerMock()
                entityManager.query.mockResolvedValue(rows)
                const service = new CvEvidenceService(asEntityManager(entityManager))

                await expect(service.resolveSelected({
                    userId: "user-1",
                    milestoneTaskAttemptIds: ids,
                })).rejects.toBeInstanceOf(CvEvidenceSelectionInvalidException)
            })

        it("defensively drops malformed persisted snapshots and derives trust separately from score",
            () => {
                const service = new CvEvidenceService(asEntityManager(makeEntityManagerMock()))
                const valid = service.parseSnapshot([
                    row(),
                    {
                        milestoneTaskAttemptId: "attempt-1",
                        milestoneTaskId: "task-1",
                        milestoneId: "milestone-1",
                        courseId: "course-1",
                        taskTitle: "Build an API",
                        milestoneTitle: "Backend capstone",
                        courseTitle: "Fullstack Master",
                        score: 0,
                        passedAt: "2026-08-01T00:00:00.000Z",
                    },
                ])

                expect(valid).toHaveLength(1)
                expect(service.evidenceLevel(valid)).toBe(CvEvidenceLevel.CapstoneVerified)
                expect(service.evidenceLevel(null)).toBe(CvEvidenceLevel.SelfReported)
            })
    })
