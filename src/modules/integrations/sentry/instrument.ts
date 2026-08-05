import Sentry from "@sentry/nestjs"
import dotenv from "dotenv"
import {
    getAppConfig,
} from "@modules/filesystem/utils/mount-secrets"
import {
    envConfig,
} from "@modules/platform/env/config"
// config dotenv
dotenv.config()
// init sentry
Sentry.init({
    dsn: getAppConfig().sentryDsn,
    environment: envConfig().nodeEnv,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
})