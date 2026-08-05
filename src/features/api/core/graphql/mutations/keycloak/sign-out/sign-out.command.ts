/** CQRS envelope carrying the httpOnly refresh token to revoke at Keycloak. */
export class SignOutCommand {
    constructor(
        public readonly refreshToken: string,
    ) {}
}

