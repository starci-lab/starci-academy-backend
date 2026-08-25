import {
    MyInProgressChallengesResolver
} from "./my-in-progress-challenges.resolver"
import {
    ChallengeProgressStatus
} from "@modules/integrations/cache/types/cache-results/challenge-submission-progress"
import {
    ChallengeEntity
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    EnrollmentEntity
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"

describe("MyInProgressChallengesResolver",
    () => {
        let entityManager: { find: jest.Mock }
        let progressService: { getProgress: jest.Mock }
        let resolver: MyInProgressChallengesResolver
        beforeEach(() => {
            entityManager = {
                find: jest.fn().mockResolvedValue([])
            }
            progressService = {
                getProgress: jest.fn()
            }
            resolver = new MyInProgressChallengesResolver(entityManager as never,
progressService as never)
        })
        it("skips challenge lookup when no enrollments exist",
            async () => {
                await expect(resolver.execute({
                    id: "user"
                } as never)).resolves.toEqual([])
                expect(progressService.getProgress).not.toHaveBeenCalled()
                expect(entityManager.find).toHaveBeenCalledWith(EnrollmentEntity,
                    expect.objectContaining({
                        take: 30
                    }))
            })
        it("maps in-progress and failed challenge titles",
            async () => {
                entityManager.find.mockResolvedValueOnce([{
                    id: "enrollment", courseId: "course"
                }]).mockResolvedValueOnce([
                    {
                        id: "challenge-1", title: "First"
                    },
                    {
                        id: "challenge-2", title: "Second"
                    },
                ])
                progressService.getProgress.mockResolvedValue({
                    completionTasks: [
                        {
                            id: "challenge-1", status: ChallengeProgressStatus.InProgress
                        },
                        {
                            id: "challenge-2", status: ChallengeProgressStatus.Failed
                        },
                        {
                            id: "completed", status: ChallengeProgressStatus.Completed
                        },
                    ]
                })
                await expect(resolver.execute({
                    id: "user"
                } as never)).resolves.toEqual([
                    expect.objectContaining({
                        label: "First", globalId: expect.any(String)
                    }),
                    expect.objectContaining({
                        label: "Second", globalId: expect.any(String)
                    }),
                ])
                expect(progressService.getProgress).toHaveBeenCalledWith({
                    courseId: "course", enrollmentId: "enrollment"
                })
                expect(entityManager.find).toHaveBeenLastCalledWith(ChallengeEntity,
                    expect.objectContaining({
                        select: {
                            id: true, title: true
                        }
                    }))
            })
    })
