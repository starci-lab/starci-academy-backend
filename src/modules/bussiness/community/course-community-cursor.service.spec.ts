import {
    CourseCommunityCursorService 
} from "./course-community-cursor.service"
import {
    CourseCommunityCursorException 
} from "@modules/platform/exceptions/errors/community/course-community"

describe("CourseCommunityCursorService",
    () => {
        const previous = process.env.COURSE_COMMUNITY_CURSOR_SECRET
        beforeAll(() => { process.env.COURSE_COMMUNITY_CURSOR_SECRET = "course-community-test-secret-at-least-32-bytes" })
        afterAll(() => { if (previous === undefined) delete process.env.COURSE_COMMUNITY_CURSOR_SECRET; else process.env.COURSE_COMMUNITY_CURSOR_SECRET = previous })
        it("binds cursors to course, mine and normalized search",
            () => {
                const service = new CourseCommunityCursorService()
                const queryHash = service.queryHash("  TypeScript ")
                const cursor = service.encode({
                    courseId: "course-a", mine: true, queryHash, createdAt: "2026-08-31T00:00:00.000Z", id: "post-a" 
                })
                expect(service.decode(cursor,
                    {
                        courseId: "course-a", mine: true, queryHash 
                    }).id).toBe("post-a")
                expect(() => service.decode(cursor,
                    {
                        courseId: "course-b", mine: true, queryHash 
                    })).toThrow(CourseCommunityCursorException)
                expect(() => service.decode(cursor,
                    {
                        courseId: "course-a", mine: false, queryHash 
                    })).toThrow(CourseCommunityCursorException)
            })
        it("rejects tampering",
            () => {
                const service = new CourseCommunityCursorService(); const queryHash = service.queryHash("")
                const cursor = service.encode({
                    courseId: "course-a", mine: false, queryHash, createdAt: "2026-08-31T00:00:00.000Z", id: "post-a" 
                })
                expect(() => service.decode(`${cursor}x`,
                    {
                        courseId: "course-a", mine: false, queryHash 
                    })).toThrow(CourseCommunityCursorException)
            })
    })
