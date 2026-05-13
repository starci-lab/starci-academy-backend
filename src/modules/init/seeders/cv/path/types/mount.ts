/**
 * A template directory discovered under `.mount/data/cv/`.
 */
export interface CvMountResolvedTemplateDir {
    /**
     * Folder name used as `template_cvs.key` (e.g. `0-standard`).
     */
    key: string
    /**
     * Absolute path to the template directory.
     */
    dirPath: string
}
