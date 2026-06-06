import {
    Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseInterceptors,
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

/**
 * Mock controller for lesson `1-mutations-and-invalidation-graph` — exposes the
 * read + create + delete endpoints the mutation/invalidation-graph demo calls.
 */
@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/4-server-state-with-tanstack-query/1-mutations-and-invalidation-graph/sessions/:sessionId")
export class MutationsController {
    /** Module display id this controller is hardcoded to serve. */
    private readonly moduleId = "4-server-state-with-tanstack-query"

    /** Lesson display id this controller is hardcoded to serve. */
    private readonly lessonId = "1-mutations-and-invalidation-graph"

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
     * Creates a user from the request body and returns the new record.
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
        // create the user in the session scope, deriving missing fields in the store
        return this.store.createUser({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId, name: body.name, email: body.email,
        })
    }

    /**
     * Deletes a user by id so the demo can show cache invalidation after a mutation.
     */
    @ApiOperation({
        summary: "Delete user",
    })
    @Delete("users/:id")
    @HttpCode(204)
    deleteUser(
        @Param("sessionId") sessionId: string,
        @Param("id",
            ParseIntPipe) userId: number,
    ): void {
        // remove the user from the session scope; store throws if the id is unknown
        this.store.deleteUser({
            moduleId: this.moduleId, lessonId: this.lessonId, sessionId, userId,
        })
    }
}
