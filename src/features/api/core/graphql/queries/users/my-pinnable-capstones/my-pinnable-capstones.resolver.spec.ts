import {
    MyPinnableCapstonesResolver
} from "./my-pinnable-capstones.resolver"

describe("MyPinnableCapstonesResolver",
    () => {
        const makeQueryBuilder = (rows: unknown[]) => {
            const queryBuilder = {
                leftJoin: jest.fn(),
                select: jest.fn(),
                addSelect: jest.fn(),
                where: jest.fn(),
                andWhere: jest.fn(),
                orderBy: jest.fn(),
                addOrderBy: jest.fn(),
                getRawMany: jest.fn().mockResolvedValue(rows),
            }
            queryBuilder.leftJoin.mockReturnValue(queryBuilder)
            queryBuilder.select.mockReturnValue(queryBuilder)
            queryBuilder.addSelect.mockReturnValue(queryBuilder)
            queryBuilder.where.mockReturnValue(queryBuilder)
            queryBuilder.andWhere.mockReturnValue(queryBuilder)
            queryBuilder.orderBy.mockReturnValue(queryBuilder)
            queryBuilder.addOrderBy.mockReturnValue(queryBuilder)
            return queryBuilder
        }

        it("queries the owner scope and maps verified/unverified raw rows",
            async () => {
                const queryBuilder = makeQueryBuilder([
                    {
                        enrollment_id: "enrollment-1",
                        course_title: "Backend",
                        github_url: "https://github.com/acme/backend",
                        is_verified: true,
                    },
                    {
                        enrollment_id: "enrollment-2",
                        course_title: null,
                        github_url: null,
                        is_verified: 0,
                    },
                ])
                const createQueryBuilder = jest.fn().mockReturnValue(queryBuilder)
                const resolver = new MyPinnableCapstonesResolver({
                    createQueryBuilder
                } as never)

                await expect(resolver.execute({
                    id: "user-1"
                } as never)).resolves.toEqual([
                    {
                        enrollmentId: "enrollment-1",
                        courseTitle: "Backend",
                        githubUrl: "https://github.com/acme/backend",
                        isVerified: true,
                    },
                    {
                        enrollmentId: "enrollment-2",
                        courseTitle: "",
                        githubUrl: null,
                        isVerified: false,
                    },
                ])
                expect(createQueryBuilder).toHaveBeenCalledWith(expect.anything(),
                    "enrollment")
                expect(queryBuilder.where).toHaveBeenCalledWith("enrollment.user_id = :userId",
                    {
                        userId: "user-1",
                    })
                expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                    "(enrollment.personal_project_github_url IS NOT NULL OR enrollment.tasks_completed_at IS NOT NULL)",
                )
                expect(queryBuilder.orderBy).toHaveBeenCalledWith("is_verified",
                    "DESC")
            })

        it("returns an empty picker and propagates query failures",
            async () => {
                const queryBuilder = makeQueryBuilder([])
                const resolver = new MyPinnableCapstonesResolver({
                    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
                } as never)
                await expect(resolver.execute({
                    id: "user-empty"
                } as never)).resolves.toEqual([])

                const failure = new Error("database unavailable")
                queryBuilder.getRawMany.mockRejectedValueOnce(failure)
                await expect(resolver.execute({
                    id: "user-1"
                } as never)).rejects.toBe(failure)
            })
    })
