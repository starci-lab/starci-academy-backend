import {
    PipeTransform, Injectable 
} from "@nestjs/common"

@Injectable()
export class BloomFilterPipe implements PipeTransform {
    constructor(
        private readonly bloomFilterService: BloomFilterService,
    ) {}
    transform(value: any) {
        return BloomFilterService.create(value)
    }
}