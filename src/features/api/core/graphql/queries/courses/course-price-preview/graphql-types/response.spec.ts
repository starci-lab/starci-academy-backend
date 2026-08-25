import {
    CoursePricePreviewData, InstallmentOptionItem 
} from "./response"
describe("course price preview response DTOs",
    () => { it("supports installment options and nullable discount",
        () => { const option = Object.assign(new InstallmentOptionItem(),
            {
                termMonths: 3, monthlyPaymentVnd: 1000, totalPaymentVnd: 3000, available: true 
            }); const data = Object.assign(new CoursePricePreviewData(),
            {
                courseId: "c1", listPriceVnd: 3000, chargedPriceVnd: 2500, discountPercent: 16, installmentOptions: [option] 
            }); expect(data).toMatchObject({
            chargedPriceVnd: 2500, installmentOptions: [{
                termMonths: 3, available: true 
            }] 
        }) }) })
