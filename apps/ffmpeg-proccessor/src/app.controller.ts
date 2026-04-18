import { Controller, Get } from '@nestjs/common';
import { FfmpegServiceService } from './ffmpeg-service.service';

@Controller()
export class FfmpegServiceController {
  constructor(private readonly ffmpegServiceService: FfmpegServiceService) {}

  @Get()
  getHello(): string {
    return this.ffmpegServiceService.getHello();
  }
}
