import {
    CourseEnrollService
} from "./course-enroll.service"

describe("CourseEnrollService",
    () => {
        it("dispatches the complete enrollment context",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    id: "enrollment"
                })
                const service = new CourseEnrollService({
                    execute
                } as never)
                const params = {
                    request: {
                        courseId: "c1"
                    }, user: {
                        id: "u1"
                    }
                } as never
                await expect(service.execute(params)).resolves.toEqual({
                    id: "enrollment"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
                execute.mockRejectedValueOnce(new Error("enrollment unavailable"))
                await expect(service.execute(params)).rejects.toThrow("enrollment unavailable")
            })
    })
