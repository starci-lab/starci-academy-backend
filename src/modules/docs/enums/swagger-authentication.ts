/**
 * OpenAPI security scheme kind for API documentation (Bearer JWT vs API key header).
 */
export enum SwaggerAuthenticationType {
    /** JWT — Try-it-out sends `Authorization: Bearer <token>` (user session). */
    Bearer = "bearer",
    /** Admin/header API key — Try-it-out sends the configured api-key header, not a user JWT. */
    ApiKey = "apiKey",
}
