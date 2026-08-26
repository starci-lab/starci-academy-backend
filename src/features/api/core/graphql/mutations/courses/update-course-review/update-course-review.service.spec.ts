import {
    UpdateCourseReviewService
} from "./update-course-review.service"

describe("UpdateCourseReviewService",
    () => {
        it("dispatches review updates, including a valid empty-body branch",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    id: "review", rating: 4
                })
                const service = new UpdateCourseReviewService({
                    execute
                } as never)
                const params = {
                    request: {
                        reviewId: "r1", rating: 4
                    }, user: {
                        id: "u1"
                    }
                } as never
                await expect(service.execute(params)).resolves.toEqual({
                    id: "review", rating: 4
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
                execute.mockRejectedValueOnce(new Error("review update rejected"))
                await expect(service.execute(params)).rejects.toThrow("review update rejected")
            })
    })
