import {
    MyInstallmentPlansService
} from "./my-installment-plans.service"
describe("MyInstallmentPlansService",
    () => {
        const manager = {
            find: jest.fn()
        }
        const payment = {
            computeMinPaymentVnd: jest.fn(() => 123)
        }
        const service = new MyInstallmentPlansService(manager as never,
payment as never)
        beforeEach(() => jest.clearAllMocks())
        it("returns an empty list without a course lookup when no plans exist",
            async () => {
                manager.find.mockResolvedValueOnce([])
                await expect(service.list("user-1")).resolves.toEqual([])
                expect(manager.find).toHaveBeenCalledTimes(1)
            })
        it("enriches plans with course titles and payment values",
            async () => {
                const plan = {
                    id: "p1", lockedCourseIds: ["c1"], nextDueAt: new Date("2026-01-01"), createdAt: new Date("2025-01-01"), status: "active", planType: "x", months: 3, installmentsPaid: 1, monthlyAmountVnd: 10, totalAmountVnd: 30, markupPercent: 0, remainingVnd: 20, minPaymentPercent: 10, minPaymentFloorVnd: 1
                }
                manager.find.mockResolvedValueOnce([plan]).mockResolvedValueOnce([{
                    id: "c1", title: "Course"
                }])
                await expect(service.list("user-1")).resolves.toMatchObject([{
                    id: "p1", minPaymentVnd: 123, courses: [{
                        id: "c1", title: "Course"
                    }]
                }])
            })
    })
