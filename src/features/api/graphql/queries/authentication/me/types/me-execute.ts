import type {
    UserEntity 
} from "@modules/databases"

/** Params for {@link MeService.execute}. */
export interface MeExecuteParams {
    user: UserEntity
}
