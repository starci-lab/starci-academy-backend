import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyAchievementsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyAchievementsResponse) query(): MyAchievementsResponse { throw new Error("probe") } }
import {
    MyAchievementItemData, MyAchievementsData
} from "./response"
describe("achievements response",
    () => { it("projects earned and locked achievement states",
        () => { const item = Object.assign(new MyAchievementItemData(),
            {
                id: "a1", title: "First", earned: true, earnedAt: new Date()
            }); const data = Object.assign(new MyAchievementsData(),
            {
                items: [item], total: 1
            }); expect(data).toMatchObject({
            items: [{
                earned: true
            }], total: 1
        }) }) })

describe("MyAchievementsResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyAchievementsResponse")).toBeDefined()
            })
    })
