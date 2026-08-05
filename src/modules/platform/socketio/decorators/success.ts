import {
    SetMetadata 
} from "@nestjs/common"
import {
    SUCCESS_MESSAGE_METADATA,
} from "../constants/decorators"
import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** Success message metadata for WS responses (supports localized map). */
export type WsSuccessMessageValue = string | Partial<Record<Locale, string>>

/**
 * Attaches the success copy (plain or locale map) the WS interceptor ships with a
 * successful emit.
 */
export const WsSuccessMessage = (message: WsSuccessMessageValue) => SetMetadata(
    SUCCESS_MESSAGE_METADATA,
    message,
)