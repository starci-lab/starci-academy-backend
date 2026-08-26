import {
    TemplateCvsHandler
} from "./template-cvs.handler"
import {
    TemplateCvsQuery
} from "./template-cvs.query"
describe("TemplateCvsHandler",
    () => {
        it("uses English by default and overlays matching translations",
            async () => {
                const template = {
                    title: "old", description: "desc", body: "body", translations: [{
                        locale: "en", field: "title", value: "New"
                    }]
                }
                const handler = new TemplateCvsHandler({
                    find: jest.fn().mockResolvedValue([template])
                } as never)
                await expect(handler.execute(new TemplateCvsQuery({
                } as never))).resolves.toEqual([expect.objectContaining({
                    title: "New"
                })])
            })
    })
