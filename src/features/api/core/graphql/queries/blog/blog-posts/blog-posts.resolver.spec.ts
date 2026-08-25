import {
    BlogPostsResolver
} from "./blog-posts.resolver"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
describe("BlogPostsResolver",
    () => { it("clamps pagination and localizes results",
        async () => { const find = jest.fn().mockResolvedValue([{
            id: "p1", slug: "hello", title: {
                en: "Hello", vi: "Xin chao"
            }, excerpt: null, category: "news", coverImageUrl: null, readingMinutes: 4, isPremium: false, publishedAt: new Date(0)
        }]); const resolver = new BlogPostsResolver({
            find
        } as never); await expect(resolver.execute(Locale.Vi,
            undefined,
            999,
            -2)).resolves.toEqual([{
            id: "p1", slug: "hello", title: "Xin chao", excerpt: null, category: "news", coverImageUrl: null, readingMinutes: 4, isPremium: false, publishedAt: new Date(0)
        }]); expect(find).toHaveBeenCalledWith(expect.anything(),
            expect.objectContaining({
                take: 50, skip: 0, where: {
                    isPublished: true
                }
            })) }) })
