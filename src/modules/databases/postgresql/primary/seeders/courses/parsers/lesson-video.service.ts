import type {
    ExtractLessonVideoBlockBothParams,
    ExtractLessonVideoBlockBothResult,
    LessonVideoDataJson,
    LessonVideoIndexesParams,
    ListLessonVideoIndexesResult,
    ParseLessonVideoParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    readJsonFileOrDefault,
    readMdFileOrDefault,
} from "@modules/common"
import {
    LessonVideoSeedDataInvalidException,
} from "@modules/exceptions"
import {
    envConfig,
} from "@modules/env"
import {
    Locale,
} from "../../../enums"
import {
    ExtractBlockService,
} from "../extracts"
import {
    LessonVideoIdFactoryService,
} from "../id-factories"
import {
    courseAlias,
} from "../utils"
import {
    listNumericChildDirectoryIndices,
} from "./utils"
import {
    DeepPartial 
} from "typeorm"
import {
    LessonVideoEntity 
} from "../../../entities"

/**
 * Folder name on the course mount for lesson videos.
 * Spelling matches existing `.mount/.../lession-videos/` directories.
 */
const LESSON_VIDEOS_MOUNT_SEGMENT = "lession-videos"

/**
 * Parses module lesson video from `en.md`, `vi.md`, and `data.json` (Title, Description + stream metadata).
 */
@Injectable()
export class LessonVideoParserService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
        private readonly lessonVideoIdFactoryService: LessonVideoIdFactoryService,
    ) {}

    /**
     * Reads the same top-level markdown section in English and Vietnamese.
     *
     * @param param - Heading key and both locale documents
     * @returns Trimmed section bodies per locale
     */
    private extractBlockBoth(
        {
            key,
            enMarkdown,
            viMarkdown,
            numHashs = 1,
        }: ExtractLessonVideoBlockBothParams,
    ): ExtractLessonVideoBlockBothResult {
        return {
            en: this.extractBlockService.extract(
                {
                    key,
                    markdown: enMarkdown,
                    numHashs,
                },
            ),
            vi: this.extractBlockService.extract(
                {
                    key,
                    markdown: viMarkdown,
                    numHashs,
                },
            ),
        }
    }

    /**
     * Directory containing `en.md`, `vi.md`, and `data.json` for one lesson video.
     *
     * @param param - Course, module, and lesson video indices
     * @returns Absolute path to that folder
     */
    private path(
        {
            courseIndex,
            moduleIndex,
            lessonVideoIndex,
        }: ParseLessonVideoParams,
    ): string {
        return `${
            envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}/modules/${moduleIndex}/${LESSON_VIDEOS_MOUNT_SEGMENT}/${lessonVideoIndex}`
    }

    /**
     * Builds a partial lesson video entity from mounted course files.
     *
     * @param param - Course, module, and lesson video indices
     * @returns Entity-shaped object suitable for TypeORM cascade save
     */
    parse(
        {
            courseIndex,
            moduleIndex,
            lessonVideoIndex,
        }: ParseLessonVideoParams,
    ): DeepPartial<LessonVideoEntity> {
        const path = this.path(
            {
                courseIndex,
                moduleIndex,
                lessonVideoIndex,
            },
        )

        const enMarkdown = readMdFileOrDefault(`${path}/en.md`)
        const viMarkdown = readMdFileOrDefault(`${path}/vi.md`)
        const dataJson = readJsonFileOrDefault<Partial<LessonVideoDataJson>>(`${path}/data.json`)

        if (typeof dataJson.url !== "string" || !dataJson.url.trim()) {
            throw new LessonVideoSeedDataInvalidException(
                {
                    path,
                    field: "url",
                },
            )
        }
        if (typeof dataJson.durationMs !== "number" || !Number.isFinite(dataJson.durationMs)) {
            throw new LessonVideoSeedDataInvalidException(
                {
                    path,
                    field: "durationMs",
                },
            )
        }

        const title = this.extractBlockBoth(
            {
                key: "Title",
                enMarkdown,
                viMarkdown,
            },
        )
        const description = this.extractBlockBoth(
            {
                key: "Description",
                enMarkdown,
                viMarkdown,
            },
        )

        const lessonVideoId = this.lessonVideoIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                lessonVideoIndex,
            },
        )

        return {
            id: lessonVideoId,
            defaultLocale: Locale.En,
            title: title.en,
            description: description.en || null,
            url: dataJson.url.trim(),
            thumbnailUrl: dataJson.thumbnailUrl?.trim() || null,
            durationMs: dataJson.durationMs,
            orderIndex: lessonVideoIndex,
            translations: [
                {
                    lessonVideoId,
                    locale: Locale.Vi,
                    field: "title",
                    value: title.vi,
                },
                {
                    lessonVideoId,
                    locale: Locale.Vi,
                    field: "description",
                    value: description.vi,
                },
            ],
        }
    }

    /**
     * Lists numeric `lession-videos/{n}/` indices on the mount for a module.
     *
     * @param param - Course and module ordinals
     * @returns Sorted lesson-video folder indices
     */
    indexes(
        {
            courseIndex,
            moduleIndex,
        }: LessonVideoIndexesParams,
    ): ListLessonVideoIndexesResult {
        return listNumericChildDirectoryIndices(
            `${envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}/modules/${moduleIndex}/${LESSON_VIDEOS_MOUNT_SEGMENT}`,
        )
    }
}
