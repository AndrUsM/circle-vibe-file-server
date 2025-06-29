import { Module } from '@nestjs/common';
import {VideosGateway} from './videos.gateway';
import { VideoService } from 'src/module';

@Module({
  providers: [VideosGateway, VideoService],
})
export class VideoGatewayModule {}