import type {
    INestApplication 
} from "@nestjs/common"

import type {
    SwaggerAuthenticationType 
} from "../enums"

/**
 * Params for setting up Swagger/OpenAPI and optional Scalar API docs on a Nest application.
 */
export interface SetupSwaggerParams {
    /** Nest application instance. */
    app: INestApplication
    /** API title shown in OpenAPI info. */
    title: string
    /** API description shown in OpenAPI info. */
    description: string
    /** API version string. */
    version: string
    /** Global route prefix (for example `"api"`). */
    basePath: string
    /** When true, enables URI-based API versioning on the app. */
    enableVersioning?: boolean
    /** When true, registers Bearer or API key security in the OpenAPI document. */
    enableAuthentication: boolean
    /** Which security scheme to register when `enableAuthentication` is true. */
    authenticationType: SwaggerAuthenticationType
    /** Name or reference id for the security scheme (for example `"Authorization"`). */
    authenticationName: string
    /** When true, mounts Scalar interactive docs in addition to Swagger UI. */
    useScalarDocs?: boolean
    /** Path segment for Scalar UI (mounted under the global prefix). */
    scalarDocsEndpoint?: string
    /** Path segment for Swagger UI (mounted under the global prefix). */
    swaggerEndpoint?: string
}

/** Result of Swagger setup (configures the Nest app in place). */
export type SetupSwaggerResult = void
