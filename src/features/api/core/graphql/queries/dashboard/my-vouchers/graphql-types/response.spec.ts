import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyVouchersResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyVouchersResponse) query(): MyVouchersResponse { throw new Error("probe") } }
import {
    MyVoucherObject
} from "./response"
describe("my vouchers response",
    () => { it("projects voucher code and redemption state",
        () => { const voucher = Object.assign(new MyVoucherObject(),
            {
                id: "v1", code: "SAVE", redeemed: false, expiresAt: null
            }); const response = Object.assign(new MyVouchersResponse(),
            {
                data: [voucher]
            }); expect(response).toMatchObject({
            data: [{
                code: "SAVE", redeemed: false, expiresAt: null
            }]
        }) }) })

describe("MyVouchersResponse GraphQL schema",
    () => {
        it("builds the response envelope",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyVouchersResponse")).toBeDefined()
            })
    })
