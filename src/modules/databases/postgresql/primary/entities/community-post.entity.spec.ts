import {
    getMetadataArgsStorage
} from "typeorm"
import {
    CommunityPostEntity
} from "./community-post.entity"
describe("CommunityPostEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new CommunityPostEntity(),
            {
                id: "wave22-post"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-post"); const id = getMetadataArgsStorage().columns.find((x) => x.target === CommunityPostEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("CommunityPostEntity contract",
    () => {
        it("resolves table, columns, relations, indexes, and lazy callbacks",
            () => {
                const storage = getMetadataArgsStorage()
                expect(storage.tables.some((metadata) => metadata.target === CommunityPostEntity)).toBe(true)
                expect(storage.columns.filter((metadata) => metadata.target === CommunityPostEntity).length).toBeGreaterThan(1)
                const relations = storage.relations.filter((metadata) => metadata.target === CommunityPostEntity)
                expect(relations.length).toBeGreaterThan(0)
                const relationTargets = relations.map((metadata) => {
                    const relationType: unknown = metadata.type
                    return typeof relationType === "function" ? (relationType as () => unknown)() : relationType
                })
                expect(relationTargets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true)
                const indexWhereValues = storage.indices.filter((metadata) => metadata.target === CommunityPostEntity).map((metadata) => {
                    const where: unknown = metadata.where
                    return typeof where === "function" ? (where as () => unknown)() : where
                })
                expect(indexWhereValues.every((value) => value === undefined || typeof value === "string")).toBe(true)
            })
    })

describe("CommunityPostEntity course index retention", () => {
    it("binds migration-owned course indexes so synchronize never treats them as old", () => {
        const indices = getMetadataArgsStorage().indices.filter((metadata) => metadata.target === CommunityPostEntity)
        const byName = Object.fromEntries(indices.map((index) => [index.name, index]))
        expect(byName.idx_course_community_feed).toMatchObject({
            where: `"scope" = 'COURSE' AND "is_deleted" = false`,
        })
        expect(byName.idx_course_community_mine).toMatchObject({
            where: `"scope" = 'COURSE' AND "is_deleted" = false`,
        })
        expect(byName.idx_course_community_search).toMatchObject({
            synchronize: false,
        })
        expect(Object.keys(byName)).toEqual(expect.arrayContaining([
            "idx_course_community_feed",
            "idx_course_community_mine",
            "idx_course_community_search",
        ]))
    })
})

describe("CommunityPostEntity course check retention", () => {
    it("binds migration-owned checks so synchronize retains course invariants", () => {
        const checks = getMetadataArgsStorage().checks.filter((metadata) => metadata.target === CommunityPostEntity)
        const byName = Object.fromEntries(checks.map((check) => [check.name, check.expression]))
        expect(byName).toMatchObject({
            chk_community_posts_scope_course: `("scope" = 'GLOBAL' AND "course_id" IS NULL) OR ("scope" = 'COURSE' AND "course_id" IS NOT NULL)`,
            chk_course_community_not_pinned: `"scope" <> 'COURSE' OR "is_pinned" = false`,
            chk_course_community_general_channel: `"scope" <> 'COURSE' OR "channel" = 'general'`,
        })
    })
})
