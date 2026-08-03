import {
    SetMetadata 
} from "@nestjs/common"
import {
    SUCCESS_MESSAGE_METADATA
} from "../constants"
import type {
    Locale,
} from "@modules/databases"

/** Success message metadata for WS responses (supports localized map). */
export type WsSuccessMessageValue = string | Partial<Record<Locale, string>>

export const WsSuccessMessage = (message: WsSuccessMessageValue) => SetMetadata(
    SUCCESS_MESSAGE_METADATA,
    message,
)