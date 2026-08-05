import {
    Body, Controller, HttpCode, Param, Post, UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    CreateUserDto, SessionStoreService,
} from "../../store"
import type {
    MockUser,
} from "../../store"
import {
    MockDelayInterceptor,
} from "../../interceptors"

@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/5-form-mastery-rhf-zod/2-multi-step-wizard-form/sessions/:sessionId")
/**
 * Mock controller for lesson `2-multi-step-wizard-form` — accepts the merged
 * payload from the final wizard step and returns the created user.
 */
export class WizardController {
    /** Module display id this controller is hardcoded to serve. */
    private readonly moduleId = "5-form-mastery-rhf-zod"

    /** Lesson display id this controller is hardcoded to serve. */
    private readonly lessonId = "2-multi-step-wizard-form"

    constructor(private readonly store: SessionStoreService) {}

    /**
     * Creates a user from the combined wizard payload and returns the new record.
     */
    @ApiOperation({
        summary: "Create user",
    })
    @Post("users")
    @HttpCode(201)
    createUser(
        @Param("sessionId") sessionId: string,
        @Body() body: CreateUserDto,
    ): MockUser {
        // persist the aggregated wizard data, scoped to this lesson's session
        return this.store.createUser({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId, name: body.name, email: body.email,
        })
    }
}
