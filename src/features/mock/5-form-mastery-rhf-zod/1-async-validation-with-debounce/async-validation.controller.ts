import {
    Controller, Get, Param, Query, UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    SessionStoreService,
} from "../../store"
import type {
    CheckUsernameResult,
} from "../../store"
import {
    MockDelayInterceptor,
} from "../../interceptors"

@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/5-form-mastery-rhf-zod/1-async-validation-with-debounce/sessions/:sessionId")
/**
 * Mock controller for lesson `1-async-validation-with-debounce` — exposes a
 * username-availability check the debounced async validator polls as the user types.
 */
export class AsyncValidationController {
    /** Module display id this controller is hardcoded to serve. */
    private readonly moduleId = "5-form-mastery-rhf-zod"

    /** Lesson display id this controller is hardcoded to serve. */
    private readonly lessonId = "1-async-validation-with-debounce"

    constructor(private readonly store: SessionStoreService) {}

    /**
     * Returns whether the queried username is available in the session.
     */
    @ApiOperation({
        summary: "Check username availability",
    })
    @Get("users/check-username")
    checkUsername(
        @Param("sessionId") sessionId: string,
        @Query("q") q?: string,
    ): CheckUsernameResult {
        // forward the candidate username; default to empty so a missing query is "available"
        return this.store.checkUsername({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId, username: q ?? "",
        })
    }
}
