import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/**
 * Input for {@link CourseMindMapService.execute}.
 */
export interface BuildCourseMindMapParams {
    /** Course primary-key id OR mount slug (`displayId`). */
    courseId: string
    /** Active request locale (reserved for localized node labels). */
    locale: Locale
}
