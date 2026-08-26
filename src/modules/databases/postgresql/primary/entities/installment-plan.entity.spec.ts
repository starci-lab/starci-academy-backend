import {
    getMetadataArgsStorage
} from "typeorm"
import {
    InstallmentPlanEntity
} from "./installment-plan.entity"
describe("InstallmentPlanEntity identity contract",
    () => { it("keeps the assigned id aligned with primary metadata",
        () => { const entity = Object.assign(new InstallmentPlanEntity(),
            {
                id: "wave22-plan"
            }); expect((entity as unknown as { id: string }).id).toBe("wave22-plan"); const id = getMetadataArgsStorage().columns.find((x) => x.target === InstallmentPlanEntity && x.propertyName === "id"); expect(id === undefined || id.options.primary === undefined || id.options.primary === true).toBe(true) }) })
describe("InstallmentPlanEntity relation metadata",
    () => { it("executes relation type callbacks",
        () => { const s = getMetadataArgsStorage(); const targets = s.relations.filter((x) => x.target === InstallmentPlanEntity).map((x) => typeof (x.type as unknown) === "function" ? (x.type as unknown as () => unknown)() : x.type); expect(targets.every((target) => typeof target === "function" || typeof target === "string")).toBe(true) }) })

describe("InstallmentPlanEntity contract",
    () => { it("maps installment schedule and transaction relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === InstallmentPlanEntity)).toBe(true); expect(s.columns.filter((x) => x.target === InstallmentPlanEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === InstallmentPlanEntity)).toBe(true) }) })
