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
        /**
         * Keep seeding idempotent.
         *
         * IMPORTANT: Do not `save()` the full course graph here because relations use `cascade: true`
         * and translation rows have unique constraints (e.g. uq_course_translation). Re-seeding would
         * attempt to insert duplicate translation rows and crash.
         *
         * We only upsert the scalar columns on `courses` table.
         */
        for (const course of courses) {
            await entityManager.save(
                CourseEntity,
                {
                    id: course.id,
                    title: course.title,
                    slug: course.slug,
                    description: course.description,
                    cdnUrl: course.cdnUrl,
                    originalPrice: course.originalPrice,
                    currentPhase: course.currentPhase,
                    defaultLocale: course.defaultLocale,
                },
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