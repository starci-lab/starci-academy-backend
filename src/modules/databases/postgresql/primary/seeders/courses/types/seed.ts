import {
    EntityManager 
} from "typeorm"

/** Parameters for updating a seed. */
export interface UpdateParams<T> {
    /** The previous seed. */
    previous: T
    /** The updated seed. */
    updated: T
    /** The entity manager. */
    entityManager: EntityManager
}