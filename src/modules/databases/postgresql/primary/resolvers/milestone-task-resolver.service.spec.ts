import {
    MilestoneTaskResolverService
} from "./milestone-task-resolver.service"
import {
    Locale
} from "../enums/locale"

describe("MilestoneTaskResolverService",
    () => {
        it("resolves fields and nested brief/criteria/code translations",
            () => {
                const resolve = jest.fn().mockReturnValue("translated")
                const criteria = {
                    translations: []
                }
                const implementation = {
                    translations: []
                }
                const task: Record<string, unknown> = {
                    translations: [], briefs: [{
                        translations: [], body: "old"
                    }], criterias: [criteria], codeImplementations: [implementation]
                }
                new MilestoneTaskResolverService({
                    resolve
                } as never,
{
    transform: jest.fn()
} as never,
{
    transform: jest.fn()
} as never).transform(task as never,
                    Locale.En,
                    Locale.Vi)
                expect(task.title).toBe("translated")
                expect(task.translations).toBeUndefined()
                expect((task.briefs as Array<Record<string, unknown>>)[0].body).toBe("translated")
                expect(resolve).toHaveBeenCalled()
            })
    })
