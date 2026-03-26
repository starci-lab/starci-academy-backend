import {
    Inject 
} from "@nestjs/common"
import {
    KEYCLOAK 
} from "./constants"

/**
 * Inject the Keycloak instance.
 */
export const InjectKeycloak = () => Inject(KEYCLOAK)