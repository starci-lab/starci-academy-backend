import Sentry from "@sentry/nestjs"
import dotenv from "dotenv"
import {
    getAppConfig 
} from "@modules/filesystem"
import {
    envConfig,
} from "@modules/env"
// config dotenv
dotenv.config()
// init sentry
Sentry.init({
    dsn: getAppConfig().sentryDsn,
    environment: envConfig().nodeEnv,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
})