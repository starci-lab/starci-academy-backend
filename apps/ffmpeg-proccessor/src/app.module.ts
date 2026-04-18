import { Module } from '@nestjs/common';
import { FfmpegServiceController } from './app.controller';
import { FfmpegServiceService } from './ffmpeg-service.service';

@Module({
  imports: [],
  controllers: [FfmpegServiceController],
  providers: [FfmpegServiceService],
})
export class FfmpegServiceModule { }
