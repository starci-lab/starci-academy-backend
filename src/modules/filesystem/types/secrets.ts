/** Keycloak admin credentials stored in mounted {@link AppConfig} (see `.mount/terraform/keycloak-admin.json`). */
export interface SecretKeycloakAdmin {
    /** The username of the keycloak admin. */
    username: string
    /** The password of the keycloak admin. */
    password: string
}