import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bài học Cấu trúc Trie cho autocomplete.
 * (EN: Domain service for Trie Data Structure for Autocomplete.)
 */
@Injectable()
export class AutocompleteService {

    private readonly frequencies = new Map<string, number>([
        ["application", 15],
        ["apple", 10],
        ["app", 8],
        ["app store", 5],
        ["apply", 4],
    ])

    /**
     * Gợi ý từ khóa theo prefix và tần suất.
     * (EN: Suggests terms by prefix and frequency.)
     */
    suggest(prefix: string) {
        return {
            prefix,
            suggestions: [...this.frequencies.entries()]
                .filter(([word]) => word.startsWith(prefix.toLowerCase()))
                .map(([word, frequency]) => ({
                    word,
                    frequency,
                }))
                .sort((a, b) => b.frequency - a.frequency || a.word.localeCompare(b.word))
                .slice(0, 5),
        }
    }

    /**
     * Cập nhật tần suất truy vấn để phản ánh tín hiệu ranking.
     * (EN: Updates query frequency as a ranking signal.)
     */
    search(query: string) {
        const normalized = query.trim().toLowerCase()
        const nextFrequency = (this.frequencies.get(normalized) ?? 0) + 1
        this.frequencies.set(normalized, nextFrequency)

        return {
            query: normalized,
            indexed: true,
            frequency: nextFrequency,
        }
    }

}
