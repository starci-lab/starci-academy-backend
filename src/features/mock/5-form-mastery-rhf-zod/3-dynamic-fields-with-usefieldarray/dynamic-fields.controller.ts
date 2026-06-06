import {
    Body, Controller, HttpCode, Param, Post, UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    CreateInvoiceDto, SessionStoreService,
} from "../../store"
import type {
    CreateInvoiceResult,
} from "../../store"
import {
    MockDelayInterceptor,
} from "../../interceptors"

/**
 * Mock controller for lesson `3-dynamic-fields-with-usefieldarray` — accepts an
 * invoice with a dynamic list of line items and returns the new id plus computed total.
 */
@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/5-form-mastery-rhf-zod/3-dynamic-fields-with-usefieldarray/sessions/:sessionId")
export class DynamicFieldsController {
    /** Module display id this controller is hardcoded to serve. */
    private readonly moduleId = "5-form-mastery-rhf-zod"

    /** Lesson display id this controller is hardcoded to serve. */
    private readonly lessonId = "3-dynamic-fields-with-usefieldarray"

    constructor(private readonly store: SessionStoreService) {}

    /**
     * Creates an invoice from the dynamic line-item array and returns `{ id, total }`.
     */
    @ApiOperation({
        summary: "Create invoice",
    })
    @Post("invoices")
    @HttpCode(201)
    createInvoice(
        @Param("sessionId") sessionId: string,
        @Body() body: CreateInvoiceDto,
    ): CreateInvoiceResult {
        // persist the invoice; the store sums the line items into the returned total
        return this.store.createInvoice({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId, customer: body.customer, items: body.items,
        })
    }
}
