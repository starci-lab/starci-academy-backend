import {
    CoursesCheckoutPreviewLine, CoursesCheckoutPreviewData 
} from "./response"
describe("checkout preview response",
    () => { it("retains line pricing and totals",
        () => { const line = Object.assign(new CoursesCheckoutPreviewLine(),
            {
                courseId: "c1", title: "Course", listPriceVnd: 1000, chargedPriceVnd: 800 
            }); const data = Object.assign(new CoursesCheckoutPreviewData(),
            {
                lines: [line], totalVnd: 800 
            }); expect(data).toMatchObject({
            lines: [{
                courseId: "c1", chargedPriceVnd: 800 
            }], totalVnd: 800 
        }) }) })
