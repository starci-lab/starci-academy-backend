import {
    NestFactory
} from "@nestjs/core"
import {
    ValidationPipe
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    AppModule
} from "./app.module"
import type {
    PnaPreflightRequestParams,
    PnaPreflightResponseParams,
} from "./mock-types"

/**
 * Bootstraps the standalone mock-sandbox service.
 *
 * Relaxed, credential-free CORS reflecting any origin -- the Sandpack preview
 * iframe calls this API from an unpredictable (often sandboxed `null`) origin,
 * and the data is public dummy data with no cookies. No Helmet, so no
 * `Cross-Origin-Resource-Policy: same-origin` header blocks the cross-origin read.
 */
const bootstrap = async () => {
    const app = await NestFactory.create(AppModule)

    // Private Network Access: Chrome blocks requests from a public origin (the
    // Sandpack preview iframe at *.sandpack.codesandbox.io) to a loopback/private
    // address (localhost) unless the preflight grants it. Answer the PNA
    // preflight by echoing the allow header before the CORS middleware runs.
    app.use(
        (
            request: PnaPreflightRequestParams,
            response: PnaPreflightResponseParams,
            next: () => void,
        ) => {
            // Chrome sends this header on the PNA preflight; grant the loopback access
            if (request.headers["access-control-request-private-network"] === "true") {
                response.setHeader("Access-Control-Allow-Private-Network",
                    "true")
            }
            next()
        },
    )

    // reflect any caller origin; no credentials so this is safe for public data.
    // PUT/HEAD are needed by the file-upload lessons (presigned PUT, tus HEAD);
    // exposedHeaders lets the browser READ the upload response headers it relies
    // on -- the ETag from a presigned PUT and the tus protocol headers.
    app.enableCors({
        origin: true,
        credentials: false,
        methods: [
            "GET",
            "HEAD",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],
        exposedHeaders: [
            "ETag",
            "Location",
            "Upload-Offset",
            "Upload-Length",
            "Tus-Resumable",
            "Tus-Version",
            "Tus-Extension",
            "Upload-Metadata"
        ],
    })

    // validate + transform request DTOs
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
    }))

    // listen on the dedicated mock port (default 3002)
    await app.listen(envConfig().services.mock.port)
}
bootstrap()
