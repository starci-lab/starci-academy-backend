import {
    InjectEntityManager 
} from "@nestjs/typeorm"
import {
    POSTGRESQL_PRIMARY,
} from "./constants/connection"

/**
 * Nest param decorator that binds the PRIMARY postgres EntityManager. Injecting
 * the wrong connection would read/write sandbox or analytics instead of live
 * course data.
 */
export const InjectPrimaryPostgreSQLEntityManager = () => InjectEntityManager(POSTGRESQL_PRIMARY)