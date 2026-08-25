import {
    InstallmentPlanItem, MyInstallmentPlansData 
} from "./response"
describe("installment plan response DTOs",
    () => { it("contains plan terms and gated courses",
        () => { const plan = Object.assign(new InstallmentPlanItem(),
            {
                id: "p1", termMonths: 6, status: "active", courses: [], createdAt: "2026-01-01T00:00:00Z" 
            }); const data = Object.assign(new MyInstallmentPlansData(),
            {
                plans: [plan] 
            }); expect(data).toMatchObject({
            plans: [{
                id: "p1", termMonths: 6, status: "active", courses: [] 
            }] 
        }) }) })
