import {
    Controller, Get, Param, UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    SessionStoreService,
} from "../../store"
import type {
    MockUser,
} from "../../store"
import {
    MockDelayInterceptor,
} from "../../interceptors"

/**
 * Mock controller for lesson `0-usequery-and-cache-lifecycle` — exposes a single
 * read endpoint the useQuery cache-lifecycle demo polls.
 */
@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/4-server-state-with-tanstack-query/0-usequery-and-cache-lifecycle/sessions/:sessionId")
export class UseQueryController {
    /** Module display id this controller is hardcoded to serve. */
    private readonly moduleId = "4-server-state-with-tanstack-query"

    /** Lesson display id this controller is hardcoded to serve. */
    private readonly lessonId = "0-usequery-and-cache-lifecycle"

    constructor(private readonly store: SessionStoreService) {}

    /**
     * Returns the full user list for the session.
     */
    @ApiOperation({
        summary: "List users",
    })
    @Get("users")
    getUsers(
        @Param("sessionId") sessionId: string,
    ): Array<MockUser> {
        // delegate to the shared store, scoped to this lesson's session
        return this.store.getUsers({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId,
        })
    }
}
