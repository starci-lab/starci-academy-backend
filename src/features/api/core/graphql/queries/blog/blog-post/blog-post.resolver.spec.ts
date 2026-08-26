import {
    BlogPostResolver
} from "./blog-post.resolver"

describe("BlogPostResolver",
    () => {
        const post = {
            id: "p1", slug: "hello", isPublished: true, isPremium: true, body: {
                en: "x".repeat(700), vi: "v"
            }, title: {
                en: "Hello", vi: "Xin chao"
            }, excerpt: null, category: "news", coverImageUrl: null, readingMinutes: 2, ctaUrl: null, ctaLabel: null, sourceUrl: null, publishedAt: new Date()
        }
        it("returns null for an unknown slug and truncates premium content for anonymous viewers",
            async () => {
                const entityManager = {
                    findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(post)
                }
                const resolver = new BlogPostResolver(entityManager as never,
{
    isActive: jest.fn()
} as never,
{
    log: jest.fn()
} as never)
                await expect(resolver.execute("en" as never,
                    undefined,
                    "missing")).resolves.toBeNull()
                const result = await resolver.execute("en" as never,
                    undefined,
                    "hello")
                expect(result?.body).toHaveLength(600)
                expect(result?.isLocked).toBe(true)
            })

        it("returns the requested locale in full for an active member",
            async () => {
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(post),
                }
                const membershipService = {
                    isActive: jest.fn().mockResolvedValue(true),
                }
                const resolver = new BlogPostResolver(
                    entityManager as never,
                    membershipService as never,
                    {
                        log: jest.fn(),
                    } as never,
                )

                await expect(resolver.execute("vi" as never,
                    {
                        id: "member-1",
                    } as never,
                    "hello")).resolves.toEqual(expect.objectContaining({
                    id: "p1",
                    title: "Xin chao",
                    body: "v",
                    isLocked: false,
                }))
                expect(membershipService.isActive).toHaveBeenCalledWith("member-1")
            })

        it("fails closed and logs when a premium membership lookup fails",
            async () => {
                const log = jest.fn()
                const resolver = new BlogPostResolver(
                    {
                        findOne: jest.fn().mockResolvedValue(post),
                    } as never,
                    {
                        isActive: jest.fn().mockRejectedValue(new Error("membership down")),
                    } as never,
                    {
                        log,
                    } as never,
                )

                const result = await resolver.execute("en" as never,
                    {
                        id: "member-1",
                    } as never,
                    "hello")

                expect(result?.isLocked).toBe(true)
                expect(result?.body).toHaveLength(600)
                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        op: "blog-post.membership-check",
                        error: "membership down",
                    }))
            })

        it("returns a non-premium post in full without checking membership",
            async () => {
                const freePost = {
                    ...post,
                    isPremium: false,
                    body: {
                        en: "free body",
                    },
                }
                const isActive = jest.fn()
                const resolver = new BlogPostResolver(
                    {
                        findOne: jest.fn().mockResolvedValue(freePost),
                    } as never,
                    {
                        isActive,
                    } as never,
                    {
                        log: jest.fn(),
                    } as never,
                )

                await expect(resolver.execute(
                    "en" as never,
                    undefined,
                    "hello",
                )).resolves.toEqual(expect.objectContaining({
                    body: "free body",
                    isLocked: false,
                }))
                expect(isActive).not.toHaveBeenCalled()
            })
    })
