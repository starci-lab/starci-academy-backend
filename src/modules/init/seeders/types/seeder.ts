import type {
    EntityManager 
} from "typeorm"

/** Contract for a seeder (seed). */
export interface Seeder {
    /**
     * Seed the data.
     * @param entityManager - The entity manager.
     * @returns void.
     */
    seed(entityManager?: EntityManager): Promise<void>
}
