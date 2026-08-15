import Sentry from "@sentry/nestjs"
import dotenv from "dotenv"
import {
    getAppConfig,
} from "@modules/filesystem/utils/mount-secrets"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    buildSentryOptions,
} from "./sentry.options"
// config dotenv
dotenv.config()
// init sentry
Sentry.init(buildSentryOptions({
    dsn: getAppConfig().sentryDsn,
    environment: envConfig().nodeEnv,
}))
