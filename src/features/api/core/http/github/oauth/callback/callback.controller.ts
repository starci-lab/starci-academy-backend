import {
    Controller,
    Get,
    Query,
    Res,
} from "@nestjs/common"
import type {
    Response,
} from "express"
import {
    ApiOperation,
} from "@nestjs/swagger"
import {
    httpConfig,
} from "../../../http"
import {
    GithubOauthCallbackService,
} from "./callback.service"

@Controller(
    {
        path: httpConfig().github().oauth().tags,
        version: "1",
    }
)
export class GithubOauthCallbackController {
    constructor(
        private readonly githubOauthCallbackService: GithubOauthCallbackService,
    ) {}

    @ApiOperation({
        summary: "GitHub OAuth callback",
        description: "Exchanges OAuth code, updates user.githubUsername, and redirects back to frontend.",
    })
    @Get(httpConfig().github().oauth().callback().path)
    async callback(
        @Query("code") code: string,
        @Query("state") state: string,
        @Res() res: Response,
    ): Promise<void> {
        const {
            redirectUri,
        } = await this.githubOauthCallbackService.execute({
            code,
            state,
        })
        res.redirect(
            302,
            redirectUri,
        )
    }
}

