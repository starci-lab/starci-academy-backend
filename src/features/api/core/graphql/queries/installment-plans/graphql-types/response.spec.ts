import {
    InstallmentPlanItem, MyInstallmentPlansData
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyInstallmentPlansResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyInstallmentPlansResponse) query(): MyInstallmentPlansResponse { throw new Error("probe") } }
describe("installment plan response DTOs",
    () => { it("contains plan terms and gated courses",
        () => { const plan = Object.assign(new InstallmentPlanItem(),
            {
                id: "p1", termMonths: 6, status: "active", courses: [], createdAt: "2026-01-01T00:00:00Z"
            }); const data = Object.assign(new MyInstallmentPlansData(),
            {
                plans: [plan]
            }); expect(data).toMatchObject({
            plans: [{
                id: "p1", termMonths: 6, status: "active", courses: []
            }]
        }) }) })

describe("MyInstallmentPlansResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyInstallmentPlansResponse")).toBeDefined()
            })
    })
