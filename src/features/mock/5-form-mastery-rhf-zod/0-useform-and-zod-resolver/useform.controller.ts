import {
    Body, Controller, HttpCode, Param, Post, UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    CreateUserDto,
} from "../../store/dtos/create-user"
import {
    SessionStoreService,
} from "../../store/session-store.service"
import type {
    MockUser,
} from "../../store/types/user"
import {
    MockDelayInterceptor,
} from "../../interceptors/mock-delay.interceptor"

@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/5-form-mastery-rhf-zod/0-useform-and-zod-resolver/sessions/:sessionId")
/**
 * Mock controller for lesson `0-useform-and-zod-resolver` -- accepts the form
 * submission and returns the created user so the demo can show the resolved
 * `{ id, email }`.
 */
export class UseFormController {
    /** Module display id this controller is hardcoded to serve. */
    private readonly moduleId = "5-form-mastery-rhf-zod"

    /** Lesson display id this controller is hardcoded to serve. */
    private readonly lessonId = "0-useform-and-zod-resolver"

    constructor(private readonly store: SessionStoreService) {}

    /**
     * Creates a user from the validated form body and returns the new record.
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
        // persist the submitted form payload, scoped to this lesson's session
        return this.store.createUser({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId, name: body.name, email: body.email,
        })
    }
}
