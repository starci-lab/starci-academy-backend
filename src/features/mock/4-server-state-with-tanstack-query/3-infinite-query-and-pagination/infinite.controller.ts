import {
    Controller, Get, Param, Query, UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    SessionStoreService,
} from "../../store/session-store.service"
import type {
    MockUsersPage,
} from "../../store/types/user"
import {
    MockDelayInterceptor,
} from "../../interceptors/mock-delay.interceptor"

@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/4-server-state-with-tanstack-query/3-infinite-query-and-pagination/sessions/:sessionId")
/**
 * Mock controller for lesson `3-infinite-query-and-pagination` -- exposes a
 * cursor-paginated user list the infinite-query demo fetches page by page.
 */
export class InfiniteController {
    /** Module display id this controller is hardcoded to serve. */
    private readonly moduleId = "4-server-state-with-tanstack-query"

    /** Lesson display id this controller is hardcoded to serve. */
    private readonly lessonId = "3-infinite-query-and-pagination"

    constructor(private readonly store: SessionStoreService) {}

    /**
     * Returns a cursor-based page of users plus the next cursor (null at the end).
     */
    @ApiOperation({
        summary: "List users page",
    })
    @Get("users")
    getUsersPage(
        @Param("sessionId") sessionId: string,
        @Query("cursor") cursorStr?: string,
        @Query("limit") limitStr?: string,
    ): MockUsersPage {
        // parse cursor/limit from the query, defaulting to the first page of 10
        return this.store.getUsersPage({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId, cursor: Number.parseInt(cursorStr ?? "0",
                10), limit: Number.parseInt(limitStr ?? "10",
                10),
        })
    }
}
