import {
    ValidateService,
} from "./validate.service"
import {
    PaginationLimitOutOfRangeException,
    PaginationPageNumberOutOfRangeException,
} from "@modules/platform/exceptions/errors/pagination/page"

describe("ValidateService",
    () => {
        it("accepts omitted limits and decimal values inside the range",
            () => {
                const service = new ValidateService()

                expect(() => service.validateLimit({
                    limit: 0,
                    min: 1,
                    max: 10,
                })).not.toThrow()
                expect(() => service.validateLimit({
                    limit: 5.5,
                    min: 1,
                    max: 10,
                })).not.toThrow()
                expect(() => service.validatePageNumber({
                    pageNumber: 2,
                    max: 3,
                })).not.toThrow()
            })

        it("throws typed errors for limits and pages outside their bounds",
            () => {
                const service = new ValidateService()

                expect(() => service.validateLimit({
                    limit: 11,
                    min: 1,
                    max: 10,
                })).toThrow(PaginationLimitOutOfRangeException)
                expect(() => service.validatePageNumber({
                    pageNumber: 0,
                    max: 3,
                })).toThrow(PaginationPageNumberOutOfRangeException)
            })
    })
