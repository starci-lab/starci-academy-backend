import {
    INestApplication
} from "@nestjs/common"
import helmet from "helmet"
import {
    envConfig,
} from "@modules/platform/env/config"
import type {
    HelmetOptions
} from "helmet"

/**
 * Create helmet options for the application.
 *
 * In production we enable a baseline Content-Security-Policy and HSTS; in
 * development we relax CSP so the Swagger / Scalar docs and the GraphQL
 * playground (which load inline scripts + remote assets) keep working.
 *
 * @returns Helmet middleware options tuned per environment.
 */
export const createHelmetOptions = (): HelmetOptions => ({
    // CSP is the most likely setting to break docs/playground tooling, so we
    // only turn it on in production where no interactive sandbox is served.
    contentSecurityPolicy: envConfig().isProduction
        ? {
            directives: {
                // start from helmet's safe defaults, then tighten frame-ancestors
                defaultSrc: ["'self'"],
                // forbid the app from being embedded in any iframe (clickjacking)
                frameAncestors: ["'none'"],
            },
        }
        : false,
    // HSTS only makes sense over HTTPS (production); skip it locally on http
    hsts: envConfig().isProduction
        ? {
            // one year, applied to subdomains, eligible for browser preload list
            maxAge: 60 * 60 * 24 * 365,
            includeSubDomains: true,
            preload: true,
        }
        : false,
    // deny framing entirely as a belt-and-suspenders alongside frame-ancestors
    frameguard: {
        action: "deny",
    },
    // strip the X-Powered-By fingerprint helmet removes by default -- keep it on
    hidePoweredBy: true,
    // prevent MIME sniffing so browsers honour declared content types
    noSniff: true,
    // do not leak full URLs as referrer to third parties
    referrerPolicy: {
        policy: "no-referrer",
    },
})

/**
 * Setup helmet security headers for the NestJS application.
 *
 * Must run before route handlers so every response carries the headers.
 *
 * @param app - The Nest application instance to attach the middleware to.
 */
export const setupHelmet = (app: INestApplication) => {
    // register helmet as global express middleware
    app.use(helmet(createHelmetOptions()))
}
