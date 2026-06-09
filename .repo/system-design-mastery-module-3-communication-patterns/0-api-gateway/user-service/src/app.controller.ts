/**
 * User Service controller — exposes POST /users and GET /users.
 * The service does not know it sits behind a gateway; it serves plain HTTP.
 */
import {
    Body,
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    AppService,
    CreateUserInput,
    User,
} from "./app.service"

@Controller("users")
/**
 * Class `AppController` — routes delegate to `AppService`.
 */
export class AppController {
    constructor(private readonly appService: AppService) {}

    /**
     * Logic — Create a user from the request body (HTTP 201 by Nest default).
     * Code — Delegate to `appService.create`.
     */
    @Post()
    create(@Body() body: CreateUserInput): User {
        return this.appService.create(body)
    }

    /**
     * Logic — Return the user list.
     * Code — Delegate to `appService.list`.
     */
    @Get()
    list(): User[] {
        return this.appService.list()
    }
}
