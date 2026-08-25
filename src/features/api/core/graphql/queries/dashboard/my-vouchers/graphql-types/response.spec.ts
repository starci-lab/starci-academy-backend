import {
    MyVoucherObject, MyVouchersResponse 
} from "./response"
describe("my vouchers response",
    () => { it("projects voucher code and redemption state",
        () => { const voucher = Object.assign(new MyVoucherObject(),
            {
                id: "v1", code: "SAVE", redeemed: false, expiresAt: null 
            }); const response = Object.assign(new MyVouchersResponse(),
            {
                data: [voucher] 
            }); expect(response).toMatchObject({
            data: [{
                code: "SAVE", redeemed: false, expiresAt: null 
            }] 
        }) }) })
