import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffmpegStatic from 'ffmpeg-static';
import { composeOptimisedFilePath } from 'src/core';

@Injectable()
export class VideoService {
  private ffmpegPath: string;

    constructor() {
    this.ffmpegPath = String(ffmpegStatic);
  }

  async compressForPreview(inputVideoPath: string): Promise<string> {
    const outputVideoPath = composeOptimisedFilePath(inputVideoPath);
    return new Promise((resolve, reject) => {
      ffmpeg(inputVideoPath)
        .setFfmpegPath(this.ffmpegPath)
        .setDuration('00:00:15')
        .output(outputVideoPath)
        .videoCodec('libx264') // Compress with H.264 codec
        .size('640x360') // Resize to 640x360 for preview
        .outputOptions('-crf', '28') // Set compression rate (lower value = higher quality)
        .on('end', () => {
          const fileName = outputVideoPath.split('/').pop();

          resolve(String(fileName));
        })
        .on('error', (err) => {
          console.error('Error compressing video:', err);
          reject(err);
        })
        .run();
    });
  }
}
