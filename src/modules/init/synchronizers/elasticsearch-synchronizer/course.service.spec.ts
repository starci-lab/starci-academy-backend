import {
    CourseElasticsearchSynchronizerService
} from "./course.service"
describe("CourseElasticsearchSynchronizerService",
    () => {
        it("runs the bootstrap enqueue exactly once",
            async () => {
                const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                const service = new CourseElasticsearchSynchronizerService({
                    now: () => new Date()
                } as never,
{
    log: jest.fn()
} as never,
enqueue as never)
                await service.onApplicationBootstrap()
                expect(enqueue.enqueue).toHaveBeenCalledTimes(1)
            })
    })
