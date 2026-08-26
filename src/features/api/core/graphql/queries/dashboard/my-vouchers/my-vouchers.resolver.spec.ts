import {
    MyVouchersResolver
} from "./my-vouchers.resolver"
import {
    VoucherStatus
} from "@modules/databases/postgresql/primary/enums/voucher-status"

describe("MyVouchersResolver",
    () => {
        it("maps course fields and derives expired status",
            async () => {
                const voucher = {
                    id: "v1", code: "SAVE", discountType: "percentage", value: 10, courseId: "c1", course: {
                        title: "Course", displayId: "course"
                    }, status: VoucherStatus.Unused, expiresAt: new Date(), usedAt: null, createdAt: new Date()
                }
                const service = {
                    listForUser: jest.fn().mockResolvedValue([voucher]), isEffectivelyExpired: jest.fn().mockReturnValue(true)
                }
                const resolver = new MyVouchersResolver(service as never)
                await expect(resolver.execute({
                    id: "u1"
                } as never)).resolves.toEqual([expect.objectContaining({
                    id: "v1", courseTitle: "Course", status: VoucherStatus.Expired
                })])
                expect(service.listForUser).toHaveBeenCalledWith("u1")
            })
    })
