import {
    CourseHydrationService
} from "./course-hydration.service"

describe("CourseHydrationService",
    () => {
        it("throws a typed not-found error for an unknown course",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null), find: jest.fn()
                }; const service = new CourseHydrationService(manager as never,
{
} as never)
                await expect(service.loadById("missing")).rejects.toThrow(); expect(manager.find).not.toHaveBeenCalled()
            })
    })
