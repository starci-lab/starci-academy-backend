/**
 * What sign-out acts on.
 *
 * The refresh token arrives from the httpOnly cookie rather than from a GraphQL argument -- it IS
 * the credential being revoked, so there is nothing for the caller to pass and nothing to validate
 * beyond its presence. It still travels as a request inside {@link ExecuteParams} like every other
 * operation's, so a handler reads `command.params.request` here exactly as it does everywhere else.
 */
export interface SignOutRequest {
    /** The httpOnly refresh token to revoke at Keycloak. */
    refreshToken: string
}
