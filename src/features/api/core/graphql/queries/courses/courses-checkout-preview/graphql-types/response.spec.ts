import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    CoursesCheckoutPreviewResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => CoursesCheckoutPreviewResponse) query(): CoursesCheckoutPreviewResponse { throw new Error("probe") } }
import {
    CoursesCheckoutPreviewLine, CoursesCheckoutPreviewData
} from "./response"
describe("checkout preview response",
    () => { it("retains line pricing and totals",
        () => { const line = Object.assign(new CoursesCheckoutPreviewLine(),
            {
                courseId: "c1", title: "Course", listPriceVnd: 1000, chargedPriceVnd: 800
            }); const data = Object.assign(new CoursesCheckoutPreviewData(),
            {
                lines: [line], totalVnd: 800
            }); expect(data).toMatchObject({
            lines: [{
                courseId: "c1", chargedPriceVnd: 800
            }], totalVnd: 800
        }) }) })

describe("CoursesCheckoutPreviewResponse GraphQL schema",
    () => {
        it("builds the declared response/request type",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("CoursesCheckoutPreviewResponse")).toBeDefined()
            })
    })
