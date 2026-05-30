import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    LeaderboardSingleQueryService,
} from "./leaderboard.service"
import {
    LeaderboardQuery,
} from "./leaderboard.query"
import type {
    UserEntity,
} from "@modules/databases"

describe("LeaderboardSingleQueryService",
    () => {
        let module: TestingModule
        let service: LeaderboardSingleQueryService
        let queryBus: jest.Mocked<QueryBus>

        beforeEach(async () => {
            queryBus = {
                execute: jest.fn(),
            } as unknown as jest.Mocked<QueryBus>

            module = await Test.createTestingModule({
                providers: [
                    LeaderboardSingleQueryService,
                    {
                        provide: QueryBus,
                        useValue: queryBus,
                    },
                ],
            }).compile()

            service = module.get<LeaderboardSingleQueryService>(LeaderboardSingleQueryService)
        })

        afterEach(async () => {
            await module.close()
        })

        it("delegates to the query bus with a LeaderboardQuery built from the params",
            async () => {
                const expected = {
                    courseId: "course-1",
                    totalChallenges: 0,
                    maxPossibleScore: 0,
                    entries: [],
                    myRank: null,
                    computedAt: new Date(),
                }
                queryBus.execute.mockResolvedValueOnce(expected)

                const params = {
                    request: {
                        courseId: "course-1", limit: 10,
                    },
                    user: {
                        id: "u1",
                    } as unknown as UserEntity,
                }

                const result = await service.execute(params)

                expect(result).toBe(expected)
                expect(queryBus.execute).toHaveBeenCalledTimes(1)
                const queryArg = queryBus.execute.mock.calls[0][0] as LeaderboardQuery
                expect(queryArg).toBeInstanceOf(LeaderboardQuery)
                expect(queryArg.params).toBe(params)
            })
    })
