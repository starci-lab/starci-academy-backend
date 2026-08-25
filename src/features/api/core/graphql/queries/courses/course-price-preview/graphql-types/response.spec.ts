import {
    CoursePricePreviewData, InstallmentOptionItem
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    CoursePricePreviewResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => CoursePricePreviewResponse) query(): CoursePricePreviewResponse { throw new Error("probe") } }
describe("course price preview response DTOs",
    () => { it("supports installment options and nullable discount",
        () => { const option = Object.assign(new InstallmentOptionItem(),
            {
                termMonths: 3, monthlyPaymentVnd: 1000, totalPaymentVnd: 3000, available: true
            }); const data = Object.assign(new CoursePricePreviewData(),
            {
                courseId: "c1", listPriceVnd: 3000, chargedPriceVnd: 2500, discountPercent: 16, installmentOptions: [option]
            }); expect(data).toMatchObject({
            chargedPriceVnd: 2500, installmentOptions: [{
                termMonths: 3, available: true
            }]
        }) }) })

describe("CoursePricePreviewResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("CoursePricePreviewResponse")).toBeDefined()
            })
    })
