import {
    Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    PatchUserDto, SessionStoreService,
} from "../../store"
import type {
    MockUser,
} from "../../store"
import {
    MockDelayInterceptor,
} from "../../interceptors"

/**
 * Mock controller for lesson `2-optimistic-updates-with-rollback` — exposes a
 * read + patch endpoint where `?fail=true` forces a server error so the demo can
 * show optimistic-update rollback.
 */
@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/4-server-state-with-tanstack-query/2-optimistic-updates-with-rollback/sessions/:sessionId")
export class OptimisticController {
    /** Module display id this controller is hardcoded to serve. */
    private readonly moduleId = "4-server-state-with-tanstack-query"

    /** Lesson display id this controller is hardcoded to serve. */
    private readonly lessonId = "2-optimistic-updates-with-rollback"

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

    /**
     * Renames a user; when `fail=true` the store throws to trigger a rollback demo.
     */
    @ApiOperation({
        summary: "Patch user",
    })
    @Patch("users/:id")
    patchUser(
        @Param("sessionId") sessionId: string,
        @Param("id",
            ParseIntPipe) userId: number,
        @Body() body: PatchUserDto,
        @Query("fail") failStr?: string,
    ): MockUser {
        // forward the rename; `fail` is driven by the query string so the demo can opt in
        return this.store.patchUser({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId, userId, name: body.name, fail: failStr === "true",
        })
    }
}
