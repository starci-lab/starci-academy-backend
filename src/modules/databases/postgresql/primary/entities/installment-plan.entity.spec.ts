import {
    getMetadataArgsStorage 
} from "typeorm"
import {
    InstallmentPlanEntity 
} from "./installment-plan.entity"
describe("InstallmentPlanEntity contract",
    () => { it("maps installment schedule and transaction relation",
        () => { const s = getMetadataArgsStorage(); expect(s.tables.some((x) => x.target === InstallmentPlanEntity)).toBe(true); expect(s.columns.filter((x) => x.target === InstallmentPlanEntity).length).toBeGreaterThan(3); expect(s.relations.some((x) => x.target === InstallmentPlanEntity)).toBe(true) }) })
