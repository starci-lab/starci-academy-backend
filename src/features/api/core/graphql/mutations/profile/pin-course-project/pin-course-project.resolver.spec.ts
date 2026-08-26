import {
    PinCourseProjectResolver
} from "./pin-course-project.resolver"
import {
    EnrollmentNotOwnedException
} from "@modules/platform/exceptions/errors/profile/pinned-project"
import {
    MAX_PINNED_PROJECTS,
} from "../pin-external-project/constants"
import {
    PinnedProjectLimitReachedException,
} from "@modules/platform/exceptions/errors/profile/pinned-project"

describe("PinCourseProjectResolver",
    () => {
        it("rejects an enrollment not owned by the user",
            async () => {
                const findOne = jest.fn().mockResolvedValue(null)
                const resolver = new PinCourseProjectResolver({
                    findOne, count: jest.fn()
                } as never)
                await expect(resolver.execute({
                    enrollmentId: "e1"
                } as never,
{
    id: "u1"
} as never)).rejects.toBeInstanceOf(EnrollmentNotOwnedException)
            })

        it("saves an owned course pin and appends its order",
            async () => {
                const save = jest.fn().mockResolvedValue({
                    id: "pin-1"
                })
                const resolver = new PinCourseProjectResolver({
                    findOne: jest.fn().mockResolvedValue({
                        personalProjectGithubUrl: "https://github.test/repo"
                    }),
                    count: jest.fn().mockResolvedValue(1),
                    save,
                } as never)
                await expect(resolver.execute({
                    enrollmentId: "e1"
                } as never,
{
    id: "u1"
} as never)).resolves.toBe("pin-1")
                expect(save).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        orderIndex: 1, url: "https://github.test/repo"
                    }))
            })

        it("rejects a full pin list after ownership is confirmed",
            async () => {
                const resolver = new PinCourseProjectResolver({
                    findOne: jest.fn().mockResolvedValue({
                        personalProjectGithubUrl: "url"
                    }),
                    count: jest.fn().mockResolvedValue(MAX_PINNED_PROJECTS),
                    save: jest.fn(),
                } as never)
                await expect(resolver.execute({
                    enrollmentId: "e1"
                } as never,
{
    id: "u1"
} as never)).rejects.toBeInstanceOf(PinnedProjectLimitReachedException)
            })
    })
