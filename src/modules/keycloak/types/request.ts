import type {
    Request,
} from "express"

import type {
    VerifiedKeycloakToken,
} from "./tokens"

/**
 * Request augmentation added by `KeycloakAuthGuard`.
 */
export interface KeycloakRequestMetadata {
    keycloak?: VerifiedKeycloakToken
}

/**
 * Express request type that may carry verified Keycloak token data.
 */
export type KeycloakRequest = Request & KeycloakRequestMetadata

