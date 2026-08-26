import {
    DeleteCourseReviewService
} from "./delete-course-review.service"

describe("DeleteCourseReviewService",
    () => {
        it("dispatches deletion and propagates command failures",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    deleted: true
                })
                const service = new DeleteCourseReviewService({
                    execute
                } as never)
                const params = {
                    request: {
                        reviewId: "r1"
                    }, user: {
                        id: "u1"
                    }
                } as never
                await expect(service.execute(params)).resolves.toEqual({
                    deleted: true
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
                execute.mockRejectedValueOnce(new Error("review deletion rejected"))
                await expect(service.execute(params)).rejects.toThrow("review deletion rejected")
            })
    })
