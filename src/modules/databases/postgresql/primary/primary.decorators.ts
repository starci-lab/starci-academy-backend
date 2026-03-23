import {
    InjectEntityManager 
} from "@nestjs/typeorm"
import {
    POSTGRESQL_PRIMARY 
} from "./constants"
// InjectPostgresql function to inject the postgresql connection based on options
export const InjectPrimaryPostgresqlEntityManager = () => InjectEntityManager(POSTGRESQL_PRIMARY)