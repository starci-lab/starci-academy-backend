/**
 * Input for {@link ModuleIdFactoryService.generate}.
 */
export interface GenerateModuleIdParams {
    /**
     * Zero-based course index (same as {@link GenerateCourseIdParams.courseIndex}).
     */
    courseIndex: number
    /**
     * Zero-based module index within that course (matches mount folder order).
     */
    moduleIndex: number
}
