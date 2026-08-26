import {
    CourseIndexerSynchronizerService
} from "./course.service"
describe("CourseIndexerSynchronizerService",
    () => {
        it("propagates an indexer enqueue failure",
            async () => {
                const failure = new Error("indexer unavailable"); const enqueue = {
                    enqueue: jest.fn().mockRejectedValue(failure)
                }
                const service = new CourseIndexerSynchronizerService({
                    now: () => new Date()
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await expect(service.onApplicationBootstrap()).rejects.toBe(failure)
            })
    })
