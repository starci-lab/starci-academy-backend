import type {
    EntityManager,
} from "typeorm"
import {
    CourseStatsProjectionService,
} from "./course-stats-projection.service"

describe("CourseStatsProjectionService",
    () => {
        it("only inserts a projection by selecting an existing course",
            async () => {
                const query = jest.fn().mockResolvedValue(undefined)
                const service = new CourseStatsProjectionService({
                    query,
                } as unknown as EntityManager)

                await service.recompute({
                    courseId: "1ab239c8-ebb5-53ee-b255-dc7839a6b959",
                })

                const [
                    sql,
                    params,
                ] = query.mock.calls[0] as [string, Array<string>]
                expect(sql).toContain("FROM courses")
                expect(sql).toContain("WHERE courses.id = $1::uuid")
                expect(params).toEqual([
                    "1ab239c8-ebb5-53ee-b255-dc7839a6b959",
                ])
            })
    })
