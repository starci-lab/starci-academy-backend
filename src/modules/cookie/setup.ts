import {
    INestApplication
} from "@nestjs/common"
import cookieParser from "cookie-parser"

/**
 * Setup cookie parser for NestJS application.
 */
export const setupCookie = (app: INestApplication) => {
    app.use(cookieParser())
}
