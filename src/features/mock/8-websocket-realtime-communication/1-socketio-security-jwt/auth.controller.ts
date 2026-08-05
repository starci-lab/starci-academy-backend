import {
    Body, Controller, HttpCode, Post, UseInterceptors,
} from "@nestjs/common"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    ApiOperation, ApiTags,
} from "@nestjs/swagger"
import {
    MockInvalidCredentialsException,
} from "@modules/platform/exceptions/errors/mock/auth"
import {
    MockDelayInterceptor,
} from "../../interceptors/mock-delay.interceptor"
import {
    AuthStoreService,
} from "./auth-store.service"
import {
    CredentialsDto,
} from "./dtos/credentials"
import type {
    JwtUser,
} from "./types/auth"

@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller("mocks/8-websocket-realtime-communication/1-socketio-security-jwt/sessions/:sessionId")
/**
 * REST auth controller for lesson `1-socketio-security-jwt`.
 *
 * Issues short-lived JWTs the WebSocket gateway then validates at handshake.
 * Mounted under the session path so the sandbox `VITE_API_BASE` (which already
 * ends in `/sessions/<uuid>`) can reach `auth/register` and `auth/login`.
 */
export class AuthController {
    constructor(
        private readonly jwt: JwtService,
        private readonly store: AuthStoreService,
    ) {}

    /**
     * Register a new account and return an access token.
     */
    @ApiOperation({
        summary: "Register and receive an access token",
    })
    @Post("auth/register")
    @HttpCode(201)
    register(
        @Body() body: CredentialsDto,
    ): { access_token: string } {
        // upsert the user and get back the claims to sign
        const user = this.store.register(body.username,
            body.password)
        // mint and return the signed JWT
        return {
            access_token: this.sign(user) 
        }
    }

    /**
     * Verify credentials and return an access token.
     */
    @ApiOperation({
        summary: "Log in and receive an access token",
    })
    @Post("auth/login")
    @HttpCode(200)
    login(
        @Body() body: CredentialsDto,
    ): { access_token: string } {
        // verify the supplied credentials against the in-memory store
        const user = this.store.verify(body.username,
            body.password)
        // reject mismatches so the client surfaces a 401
        if (!user) throw new MockInvalidCredentialsException({
        })
        // mint and return the signed JWT
        return {
            access_token: this.sign(user) 
        }
    }

    /**
     * Sign the JWT user claims into an access token.
     */
    private sign(user: JwtUser): string {
        // embed subject id + username so the gateway can derive the identity
        return this.jwt.sign({
            sub: user.sub, username: user.username 
        })
    }
}
