import type {
    Locale,
} from "@modules/databases"
import type {
    LoginInitInput,
} from "./graphql-types"

export interface LoginInitCommandParams {
    input: LoginInitInput
    locale: Locale
}

export class LoginInitCommand {
    constructor(
        readonly params: LoginInitCommandParams,
    ) {}
}

