import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bai hoc Phan doan file va luu tru metadata.
 * (EN: Domain service for File Chunking and Metadata Storage.)
 */
@Injectable()
export class MetadataService {

    /**
     * Chia file thanh cac chunk va tra ve metadata du de tai lap object.
     * (EN: Splits a file into chunks and returns metadata sufficient to rebuild the object.)
     */
    chunkFile(fileId: string, fileName: string, sizeBytes: number, chunkSizeBytes: number) {
        const chunkCount = Math.ceil(sizeBytes / chunkSizeBytes)
        const chunks = Array.from({ length: chunkCount }, (_, index) => {
            const startByte = index * chunkSizeBytes
            const endByte = Math.min(startByte + chunkSizeBytes - 1, sizeBytes - 1)

            return {
                chunkId: `${fileId}-part-${index.toString().padStart(3, "0")}`,
                index,
                startByte,
                endByte,
                sizeBytes: endByte - startByte + 1,
                storageKey: `objects/${fileId}/chunks/${index}`,
            }
        })

        return {
            fileId,
            fileName,
            sizeBytes,
            chunkSizeBytes,
            chunkCount,
            manifestVersion: 1,
            chunks,
        }
    }

}
