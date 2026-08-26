import {
    SubmitCourseReviewService
} from "./submit-course-review.service"

describe("SubmitCourseReviewService",
    () => {
        it("dispatches review submission and returns the command result",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    id: "review"
                })
                const service = new SubmitCourseReviewService({
                    execute
                } as never)
                const params = {
                    request: {
                        courseId: "c1", rating: 5, body: "Great"
                    }, user: {
                        id: "u1"
                    }
                } as never
                await expect(service.execute(params)).resolves.toEqual({
                    id: "review"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
                execute.mockRejectedValueOnce(new Error("review rejected"))
                await expect(service.execute(params)).rejects.toThrow("review rejected")
            })
    })
