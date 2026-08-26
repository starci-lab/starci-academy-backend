import {
    ResolveRouteResolver
} from "./resolve-route.resolver"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"

describe("ResolveRouteResolver",
    () => {
        it("returns null for invalid IDs and a profile route for users",
            async () => {
                const resolver = new ResolveRouteResolver({
                    findOne: jest.fn()
                } as never,
{
    get: jest.fn()
} as never)
                await expect(resolver.execute({
                    globalId: "bad"
                })).resolves.toEqual({
                    path: null
                })
                const id = Buffer.from(`${UserEntity.name}:u1`).toString("base64")
                await expect(resolver.execute({
                    globalId: id
                })).resolves.toEqual({
                    path: "/users/u1"
                })
            })

        it("resolves coding-problem slugs and returns null when absent",
            async () => {
                const findOne = jest.fn().mockResolvedValueOnce({
                    slug: "two-sum"
                }).mockResolvedValueOnce(null)
                const resolver = new ResolveRouteResolver({
                    findOne
                } as never,
{
    get: jest.fn()
} as never)
                const first = Buffer.from(`${CodingProblemEntity.name}:p1`).toString("base64")
                const second = Buffer.from(`${CodingProblemEntity.name}:p2`).toString("base64")
                await expect(resolver.execute({
                    globalId: first
                })).resolves.toEqual({
                    path: "/practice/two-sum"
                })
                await expect(resolver.execute({
                    globalId: second
                })).resolves.toEqual({
                    path: null
                })
            })

        it("uses the parent-index cache for course routes",
            async () => {
                const get = jest.fn().mockResolvedValue({
                    course: {
                        id: "course-1", displayId: "academy"
                    }
                })
                const resolver = new ResolveRouteResolver({
                    findOne: jest.fn()
                } as never,
{
    get
} as never)
                const globalId = Buffer.from(`${CourseEntity.name}:course-1`).toString("base64")
                await expect(resolver.execute({
                    globalId
                })).resolves.toEqual({
                    path: "/courses/academy"
                })
                expect(get).toHaveBeenCalled()
            })
    })
