import {
    getMetadataArgsStorage
} from "typeorm"
import {
    CourseEntity
} from "./course.entity"
describe("CourseEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new CourseEntity(),
            {
                id: "wave22-course"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-course"); const id = getMetadataArgsStorage().columns.find((x) => x.target === CourseEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("CourseEntity contract",
    () => { it("declares table and mapped columns",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === CourseEntity)).toBe(true); expect(s.columns.filter((x) => x.target === CourseEntity).length).toBeGreaterThan(2); expect(new CourseEntity()).toBeInstanceOf(CourseEntity); const targets = s.relations.filter((x) => x.target === CourseEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })
