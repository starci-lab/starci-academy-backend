import {
    Injectable 
} from "@nestjs/common"
import {
    EntityManager, 
    In
} from "typeorm"
import {
    CourseEntity,
} from "../../entities"
import {
    Seeder 
} from "../types"
import {
    courses 
} from "@modules/databases/postgresql/primary/data/courses"
/**
 * The service for the Courses.
 */
@Injectable()
export class CoursesService implements Seeder {
    /**
     * Seed the courses.
     * @returns void.
     */
    async seed(
        entityManager: EntityManager
    ) {
        // if no courses, return
        if (courses.length === 0) {
            return
        }
        // insert() only writes course columns; relations need save() + cascade
        for (const course of courses) {
            await entityManager.save(
                CourseEntity,
                course,
            )
        }
    }

    /**
     * Drop the courses.
     * @returns void.
     */
    async drop(
        entityManager: EntityManager
    ) {
        // get the courses ids
        const ids = courses.map(
            (course) => course.id
        ).filter(Boolean)
        // if no courses ids, return
        if (ids.length === 0) {
            return
        }
        // delete the courses
        await entityManager.delete(
            CourseEntity,
            {
                id: In(ids) 
            }
        )
    }
}