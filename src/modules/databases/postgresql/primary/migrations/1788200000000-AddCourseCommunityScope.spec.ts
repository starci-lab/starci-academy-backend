import {
    AddCourseCommunityScope1788200000000 
} from "./1788200000000-AddCourseCommunityScope"
import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    CommunityPostEntity 
} from "../entities/community-post.entity"

describe("AddCourseCommunityScope migration",
    () => {
        it("adds discriminator integrity, scoped indexes, receipts, outbox and reply protection",
            async () => {
                const statements: Array<string> = []
                await new AddCourseCommunityScope1788200000000().up({
                    query: jest.fn(async (sql: string) => { statements.push(sql) }) 
                } as never)
                const sql = statements.join("\n")
                expect(sql).toContain("chk_community_posts_scope_course")
                expect(sql).toContain("idx_course_community_feed")
                expect(sql).toContain("community_command_receipts")
                expect(sql).toContain("community_outbox")
                expect(sql).toContain("trg_community_reply_same_post")
            })

        it("continues from a database where TypeORM already materialized the enum and columns",
            async () => {
                const statements: Array<string> = []
                const query = jest.fn(async (sql: string) => {
                    statements.push(sql)
                    if (/^CREATE TYPE "community_scope"/.test(sql)) throw new Error("type community_scope already exists")
                    if (/ADD "(?:scope|course_id)"/.test(sql)) throw new Error("column already exists")
                })
                await expect(new AddCourseCommunityScope1788200000000().up({
                    query 
                } as never)).resolves.toBeUndefined()
                const sql = statements.join("\n")
                expect(sql).toContain("EXCEPTION WHEN duplicate_object")
                expect(sql).toContain("ADD COLUMN IF NOT EXISTS \"scope\"")
                expect(sql).toContain("ADD COLUMN IF NOT EXISTS \"course_id\"")
                expect(sql).toContain("ALTER COLUMN \"scope\" SET NOT NULL")
                expect(sql).toContain("VALIDATE CONSTRAINT \"chk_community_posts_scope_course\"")
                expect(sql).toContain("CREATE TABLE IF NOT EXISTS \"community_command_receipts\"")
                expect(sql).toContain("CREATE TABLE IF NOT EXISTS \"community_outbox\"")
            })

        it("keeps every migration-owned course index represented in entity metadata",
            async () => {
                const statements: Array<string> = []
                await new AddCourseCommunityScope1788200000000().up({
                    query: jest.fn(async (sql: string) => { statements.push(sql) }) 
                } as never)
                const sql = statements.join("\n")
                const names = getMetadataArgsStorage().indices.filter((index) => index.target === CommunityPostEntity).map((index) => index.name).filter(Boolean)
                for (const name of ["idx_course_community_feed",
                    "idx_course_community_mine",
                    "idx_course_community_search"]) {
                    expect(names).toContain(name)
                    expect(sql).toContain(`CREATE INDEX IF NOT EXISTS "${name}"`)
                }
            })
        it("keeps every migration-owned check represented exactly in entity metadata",
            async () => {
                const statements: Array<string> = []
                await new AddCourseCommunityScope1788200000000().up({
                    query: jest.fn(async (sql: string) => { statements.push(sql) }) 
                } as never)
                const sql = statements.join("\n")
                const checks = getMetadataArgsStorage().checks.filter((check) => check.target === CommunityPostEntity)
                const byName = Object.fromEntries(checks.map((check) => [check.name,
                    check.expression]))
                for (const name of ["chk_community_posts_scope_course",
                    "chk_course_community_not_pinned",
                    "chk_course_community_general_channel"]) {
                    expect(byName[name]).toBeDefined()
                    expect(sql).toContain(`ADD CONSTRAINT "${name}" CHECK (${byName[name]}) NOT VALID`)
                    expect(sql).toContain(`VALIDATE CONSTRAINT "${name}"`)
                }
            })
    })
