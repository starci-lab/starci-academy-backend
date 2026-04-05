import {
    Injectable,
} from "@nestjs/common"
import {
    SubmissionType,
} from "../../../enums"
import type {
    ExtractSubmissionsParams,
    ExtractSubmissionsResult,
} from "./types"
import {
    ExtractBlockService,
} from "./extract-block.service"

/**
 * Parses `## (GitHub|Google Docs) Title` headings into submission descriptors.
 */
@Injectable()
export class ExtractSubmissionsService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
    ) {}

    /**
     * @param param - Markdown containing submission subheadings.
     * @returns Typed submission rows with bodies under each `##`.
     */
    extract(
        {
            markdown,
        }: ExtractSubmissionsParams,
    ): ExtractSubmissionsResult {
        const lines = markdown.split("\n")
        const results: ExtractSubmissionsResult = []
        let orderIndex = 0

        for (const line of lines) {
            const trimmed = line.trim()

            if (!trimmed.startsWith("##")) {
                continue
            }

            const match = trimmed.match(/^##\s*\((.*?)\)\s*(.*)$/)

            if (!match) {
                continue
            }

            const rawType = match[1].toLowerCase()

            let type: SubmissionType = SubmissionType.GithubUrl

            if (rawType.includes("github")) {
                type = SubmissionType.GithubUrl
            } else if (rawType.includes("google docs")) {
                type = SubmissionType.GoogleDocsUrl
            }

            const description = this.extractBlockService.extract({
                key: match[0].replace(
                    /^##\s*/,
                    "",
                ),
                markdown,
                numHashs: 2,
            })

            results.push({
                type,
                title: match[2].trim(),
                description,
                orderIndex,
            })

            orderIndex++
        }

        return results
    }
}
