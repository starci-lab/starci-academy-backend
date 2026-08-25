import {
    UserSolvedChallengeDetailAttemptData, UserSolvedChallengeDetailData
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    UserSolvedChallengeDetailResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => UserSolvedChallengeDetailResponse) query(): UserSolvedChallengeDetailResponse { throw new Error("probe") } }
describe("solved challenge detail response DTOs",
    () => { it("retains attempt feedback and best-attempt summary",
        () => { const attempt = Object.assign(new UserSolvedChallengeDetailAttemptData(),
            {
                id: "a1", score: 80, passed: true, feedback: null, submittedAt: new Date()
            }); const data = Object.assign(new UserSolvedChallengeDetailData(),
            {
                challengeId: "c1", title: "Two sum", attempts: [attempt], bestScore: 80
            }); expect(data).toMatchObject({
            challengeId: "c1", attempts: [{
                passed: true, feedback: null
            }], bestScore: 80
        }) }) })

describe("UserSolvedChallengeDetailResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("UserSolvedChallengeDetailResponse")).toBeDefined()
            })
    })
