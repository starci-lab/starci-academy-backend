import {
    IsOptional,
    IsUUID,
} from "class-validator"

/**
 * Optional user id so an admin can trigger verify-email in the same call as the adapter
 * swap -- omit to only reconfigure SMTP.
 */
export class KeycloakConfigureMailAdapterRequest {
    @IsOptional()
    @IsUUID()
        verifyEmailUserId?: string
}
