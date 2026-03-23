import type {
    EntityManager 
} from "typeorm"

/** Contract for a seeder (seed and drop). */
export interface Seeder {
    seed(entityManager?: EntityManager): Promise<void>
    drop(entityManager?: EntityManager): Promise<void>
}
