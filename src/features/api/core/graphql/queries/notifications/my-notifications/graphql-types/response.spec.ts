import {
    NotificationI18nTextObject, NotificationObject, MyNotificationsResponseData
} from "./response"
import {
    Test
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver
} from "@nestjs/graphql"
import {
    MyNotificationsResponse
} from "./response"
@Resolver()
class StaticProbe { @Query(() => MyNotificationsResponse) query(): MyNotificationsResponse { throw new Error("probe") } }
describe("my notifications response DTOs",
    () => { it("preserves i18n params and unread state",
        () => { const title = Object.assign(new NotificationI18nTextObject(),
            {
                key: "notification.test", params: {
                    actor: "Alice"
                }
            }); const notification = Object.assign(new NotificationObject(),
            {
                id: "n1", type: "NewFollower", title, body: null, isRead: false, target: null, readAt: null, createdAt: new Date()
            }); const data = Object.assign(new MyNotificationsResponseData(),
            {
                items: [notification], total: 1, unreadCount: 1
            }); expect(data).toMatchObject({
            items: [{
                title: {
                    key: "notification.test", params: {
                        actor: "Alice"
                    }
                }, isRead: false, target: null
            }], unreadCount: 1
        }) }) })

describe("MyNotificationsResponse GraphQL schema",
    () => {
        it("builds the response envelope and reachable field metadata",
            async () => {

                const moduleRef = await Test.createTestingModule({
                    imports: [GraphQLSchemaBuilderModule]
                }).compile()
                const schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([StaticProbe])
                expect(schema.getQueryType()?.getFields()).toHaveProperty("query")
                expect(schema.getType("MyNotificationsResponse")).toBeDefined()
            })
    })
