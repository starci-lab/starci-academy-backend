/** Supported one-time OAuth state namespaces. */
export enum OAuthStatePurpose {
    /** Keycloak broker login state, separated by identity provider. */
    KeycloakBroker = "keycloak-broker",
    /** GitHub account-link state for an already authenticated learner. */
    GithubAccountLink = "github-account-link",
}

/** Parameters for issuing one one-time OAuth state record. */
export interface IssueOAuthStateParams<T> {
    /** Security namespace preventing a state from crossing OAuth flows. */
    purpose: OAuthStatePurpose
    /** Internal data bound to the opaque state value. */
    payload: T
}

/** Parameters for consuming one one-time OAuth state record. */
export interface ConsumeOAuthStateParams {
    /** Security namespace used when the state was issued. */
    purpose: OAuthStatePurpose
    /** Opaque state value returned by the OAuth provider. */
    state: string
}
