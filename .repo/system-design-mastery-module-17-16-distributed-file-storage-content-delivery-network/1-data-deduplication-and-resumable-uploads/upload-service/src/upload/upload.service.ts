import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bai hoc Deduplication va resumable upload.
 * (EN: Domain service for Data Deduplication and Resumable Uploads.)
 */
@Injectable()
export class UploadService {

    private readonly knownChecksums = new Set<string>([
        "sha256:hero-image-part-000",
        "sha256:catalog-export-part-004",
    ])

    /**
     * Ghi nhan chunk va phan biet chunk moi voi chunk da ton tai.
     * (EN: Records a chunk and distinguishes new data from already stored data.)
     */
    acceptChunk(uploadId: string, checksum: string, offsetBytes: number, sizeBytes: number) {
        const deduplicated = this.knownChecksums.has(checksum)
        this.knownChecksums.add(checksum)

        return {
            uploadId,
            checksum,
            offsetBytes,
            sizeBytes,
            deduplicated,
            nextOffsetBytes: offsetBytes + sizeBytes,
            resumeToken: `${uploadId}:${offsetBytes + sizeBytes}`,
            storageAction: deduplicated ? "link-existing-blob" : "store-new-blob",
        }
    }

}
