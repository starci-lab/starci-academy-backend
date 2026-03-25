import {
    Injectable 
} from "@nestjs/common"
import {
    InjectEntityManager 
} from "@nestjs/typeorm"
import {
    EntityManager, 
    In
} from "typeorm"
import {
    courses 
} from "./data"
import {
    CourseEntity 
} from "../../entities"
import {
    Seeder 
} from "../types"

/**
 * The service for the Courses.
 */
@Injectable()
export class CoursesService implements Seeder {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager
    ) { }

    /**
     * Seed the courses.
     * @returns void.
     */
    async seed(entityManager: EntityManager) {
        // seed the courses
        await entityManager.insert(
            CourseEntity,
            courses
        )
    }

    /**
     * Drop the courses.
     * @returns void.
     */
    async drop(entityManager: EntityManager) {
        await entityManager.delete(
            CourseEntity,
            {
                id: In(courses.map(course => course.id)) 
            }
        )
    }
}