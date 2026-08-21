import {
    ChallengeOutputEntity,
} from "../entities/challenge-output.entity"
import {
    ChallengePrerequisiteEntity,
} from "../entities/challenge-prerequisite.entity"
import {
    ChallengeRequirementEntity,
} from "../entities/challenge-requirement.entity"
import {
    ChallengeStepEntity,
} from "../entities/challenge-step.entity"
import {
    ChallengeSubmissionEntity,
} from "../entities/challenge-submission.entity"
import {
    ChallengeEntity,
} from "../entities/challenge.entity"
import {
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
import {
    ChallengeHydrationService,
} from "./challenge-hydration.service"

const entityRow = (
    values: Record<string, unknown>,
) => ({
    ...values,
    toPlain: jest.fn().mockReturnValue({
        ...values,
    }),
})

describe("ChallengeHydrationService",
    () => {
        it("hydrates a standalone challenge with every ordered child collection",
            async () => {
                const challenge = entityRow({
                    id: "challenge-1",
                    title: "Challenge",
                })
                const requirement = entityRow({
                    id: "requirement-1",
                    challengeId: "challenge-1",
                    sortIndex: 0,
                    langs: [{
                        translations: [{
                            value: "Requirement",
                        }],
                    }],
                })
                const step = entityRow({
                    id: "step-1",
                    challengeId: "challenge-1",
                    sortIndex: 0,
                    langs: [{
                        translations: [{
                            value: "Step",
                        }],
                    }],
                })
                const output = entityRow({
                    id: "output-1",
                    challengeId: "challenge-1",
                    sortIndex: 0,
                    langs: [{
                        translations: [{
                            value: "Output",
                        }],
                    }],
                })
                const prerequisite = entityRow({
                    id: "prerequisite-1",
                    challengeId: "challenge-1",
                    sortIndex: 0,
                    langs: [{
                        translations: [{
                            value: "Prerequisite",
                        }],
                    }],
                })
                const submissions = [
                    entityRow({
                        id: "submission-1",
                        challengeId: "challenge-1",
                        sortIndex: 0,
                        translations: [{
                            value: "Repository",
                        }],
                    }),
                    entityRow({
                        id: "submission-2",
                        challengeId: "challenge-1",
                        sortIndex: 1,
                        translations: [{
                            value: "Runbook",
                        }],
                    }),
                ]
                const rows = new Map<unknown, Array<ReturnType<typeof entityRow>>>([
                    [ChallengeRequirementEntity,
                        [requirement]],
                    [ChallengeStepEntity,
                        [step]],
                    [ChallengeOutputEntity,
                        [output]],
                    [ChallengePrerequisiteEntity,
                        [prerequisite]],
                    [ChallengeSubmissionEntity,
                        submissions],
                ])
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(challenge),
                    find: jest.fn((entity: unknown) => Promise.resolve(rows.get(entity) ?? [])),
                }
                const service = new ChallengeHydrationService(entityManager as never)

                const result = await service.loadById("challenge-1")

                expect(result).toMatchObject({
                    id: "challenge-1",
                    requirements: [{
                        id: "requirement-1",
                    }],
                    steps: [{
                        id: "step-1",
                    }],
                    outputs: [{
                        id: "output-1",
                    }],
                    prerequisites: [{
                        id: "prerequisite-1",
                    }],
                    submissions: [{
                        id: "submission-1",
                    },
                    {
                        id: "submission-2",
                    }],
                })
                expect(result.submissions[0].translations).toEqual([{
                    value: "Repository",
                }])
                expect(entityManager.find).toHaveBeenCalledWith(
                    ChallengeSubmissionEntity,
                    expect.objectContaining({
                        relations: {
                            translations: true,
                        },
                        order: {
                            sortIndex: "ASC",
                        },
                    }),
                )
            })

        it("hydrates content challenges in order and assigns children only to their owner",
            async () => {
                const challengeOne = entityRow({
                    id: "challenge-1",
                    sortIndex: 0,
                })
                const challengeTwo = entityRow({
                    id: "challenge-2",
                    sortIndex: 1,
                })
                const rows = new Map<unknown, Array<ReturnType<typeof entityRow>>>([
                    [ChallengeEntity,
                        [challengeOne,
                            challengeTwo]],
                    [ChallengeRequirementEntity,
                        [
                            entityRow({
                                id: "requirement-1",
                                challengeId: "challenge-1",
                            }),
                            entityRow({
                                id: "requirement-2",
                                challengeId: "challenge-2",
                            }),
                        ]],
                    [ChallengeStepEntity,
                        []],
                    [ChallengeOutputEntity,
                        []],
                    [ChallengePrerequisiteEntity,
                        []],
                    [ChallengeSubmissionEntity,
                        [
                            entityRow({
                                id: "submission-1",
                                challengeId: "challenge-1",
                                sortIndex: 0,
                            }),
                            entityRow({
                                id: "submission-2",
                                challengeId: "challenge-2",
                                sortIndex: 0,
                            }),
                        ]],
                ])
                const entityManager = {
                    findOne: jest.fn(),
                    find: jest.fn((entity: unknown) => Promise.resolve(rows.get(entity) ?? [])),
                }
                const service = new ChallengeHydrationService(entityManager as never)

                const result = await service.loadByContentId("content-1")

                expect(result.map((challenge) => challenge.id)).toEqual([
                    "challenge-1",
                    "challenge-2",
                ])
                expect(result[0].requirements.map((row) => row.id)).toEqual(["requirement-1"])
                expect(result[1].requirements.map((row) => row.id)).toEqual(["requirement-2"])
                expect(result[0].submissions.map((row) => row.id)).toEqual(["submission-1"])
                expect(result[1].submissions.map((row) => row.id)).toEqual(["submission-2"])
            })

        it("raises the domain exception when the standalone challenge is absent",
            async () => {
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(null),
                    find: jest.fn(),
                }
                const service = new ChallengeHydrationService(entityManager as never)

                await expect(service.loadById("missing-challenge"))
                    .rejects.toBeInstanceOf(ChallengeNotFoundException)
                expect(entityManager.find).not.toHaveBeenCalled()
            })

        it("returns an empty content-scoped collection without querying child tables",
            async () => {
                const entityManager = {
                    findOne: jest.fn(),
                    find: jest.fn().mockResolvedValue([]),
                }
                const service = new ChallengeHydrationService(entityManager as never)

                await expect(service.loadByContentId("content-without-challenges"))
                    .resolves.toEqual([])
                expect(entityManager.find).toHaveBeenCalledTimes(1)
                expect(entityManager.find).toHaveBeenCalledWith(
                    ChallengeEntity,
                    expect.objectContaining({
                        order: {
                            sortIndex: "ASC",
                        },
                    }),
                )
            })
    })
