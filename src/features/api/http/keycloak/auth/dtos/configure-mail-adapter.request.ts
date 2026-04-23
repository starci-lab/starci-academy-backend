import {
    IsOptional,
    IsUUID,
} from "class-validator"

export class KeycloakConfigureMailAdapterRequest {
    @IsOptional()
    @IsUUID()
        verifyEmailUserId?: string
}
