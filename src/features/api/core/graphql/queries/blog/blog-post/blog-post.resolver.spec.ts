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
    })
