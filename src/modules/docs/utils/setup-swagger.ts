import {
    VersioningType,
} from "@nestjs/common"
import {
    DocumentBuilder,
    SwaggerModule,
} from "@nestjs/swagger"
import {
    apiReference,
} from "@scalar/nestjs-api-reference"

import {
    SwaggerAuthenticationType,
} from "../enums/swagger-authentication"
import type {
    SetupSwaggerParams,
} from "../types/swagger"

/**
 * Configures OpenAPI (Swagger UI), optional Scalar docs, global prefix, and optional URI versioning.
 *
 * @param params - App instance and OpenAPI/UI options
 * @returns Nothing; mutates the Nest application (routes and middleware)
 *
 * @example
 * setupSwagger({
 *   app,
 *   title: "My API",
 *   description: "REST API",
 *   version: "1.0",
 *   basePath: "api",
 *   enableAuthentication: true,
 *   authenticationType: SwaggerAuthenticationType.Bearer,
 *   authenticationName: "access-token",
 * })
 */
export const setupSwagger = ({
    app,
    title,
    description,
    version,
    basePath,
    enableVersioning = true,
    enableAuthentication,
    authenticationType,
    authenticationName,
    useScalarDocs = true,
    scalarDocsEndpoint = "scalar",
    swaggerEndpoint = "swagger",
}: SetupSwaggerParams): void => {
    // build OpenAPI metadata
    const builder = new DocumentBuilder()
        .setTitle(title)
        .setDescription(description)
        .setVersion(version)

    // enable URI versioning when requested
    if (enableVersioning) {
        app.enableVersioning({
            type: VersioningType.URI,
        })
    }

    // set global API prefix
    app.setGlobalPrefix(basePath)

    // register security schemes in the OpenAPI document
    if (enableAuthentication) {
        if (authenticationType === SwaggerAuthenticationType.Bearer) {
            builder.addBearerAuth(
                undefined,
                authenticationName,
            )
        } else if (authenticationType === SwaggerAuthenticationType.ApiKey) {
            builder.addApiKey(
                {
                    type: "apiKey",
                    name: authenticationName,
                    in: "header",
                },
                authenticationName,
            )
        }
    }

    if (useScalarDocs) {
        builder.addBearerAuth(
            undefined,
            authenticationName,
        )
    }

    const options = builder.build()

    // generate OpenAPI document from the app
    const document = SwaggerModule.createDocument(
        app,
        options,
    )

    // serve Swagger UI
    if (swaggerEndpoint) {
        SwaggerModule.setup(
            swaggerEndpoint,
            app,
            document,
        )
    }

    // serve Scalar reference UI
    if (useScalarDocs) {
        app.use(
            scalarDocsEndpoint,
            apiReference({
                content: document,
                customCss: `
          body { font-family: 'JetBrains Mono', monospace; }
        `,
            }),
        )
    }
}
