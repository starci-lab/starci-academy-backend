import {
    S3NameResolverService
} from "./s3-name-resolver.service"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"

describe("S3NameResolverService",
    () => {
        it("resolves localized and default object names",
            () => {
                const service = new S3NameResolverService()
                expect(service.challenge("c",
                    Locale.En)).toBe("challenges/c/en.json")
                expect(service.course("course")).toBe("courses/course.json")
                expect(service.module("m",
                    Locale.Vi)).toBe("modules/m/vi.json")
                expect(service.content("content")).toBe("contents/content.json")
                expect(service.milestoneTask("task",
                    Locale.En)).toBe("milestone-tasks/task/en.json")
                expect(service.repo("repo",
                    "dir")).toBe("repo/repo/dir.json")
            })
    })
