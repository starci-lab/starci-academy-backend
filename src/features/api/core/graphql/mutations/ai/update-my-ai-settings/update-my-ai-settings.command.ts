import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UpdateMyAiSettingsRequest,
} from "./graphql-types"

export class UpdateMyAiSettingsCommand {
    constructor(
        readonly params: ExecuteParams<UpdateMyAiSettingsRequest>,
    ) { }
}
