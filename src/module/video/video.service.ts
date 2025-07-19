import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { Response, Request } from 'express';
import { createReadStream, statSync, existsSync } from 'fs';
import * as ffmpegStatic from 'ffmpeg-static';
import { composeOptimisedFilePath } from 'src/core';
import {
  MP4_CONVERT_OUTPUT_OPTIONS,
  VIDEO_CONTENT_TYPE,
  VIDEO_FILE_DESTINATION,
} from './constants';
import * as path from 'path';

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

  convertToMp4(inputPath: string, outputPath: string): Promise<string> {
    const fileExtension = path.extname(inputPath);

    if (fileExtension === '.mp4') {
      return new Promise((resolve, reject) => {
        resolve(outputPath);
      });
    }

    return new Promise((resolve, reject) =>
      ffmpeg(inputPath)
        .outputOptions(MP4_CONVERT_OUTPUT_OPTIONS)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(`Conversion error: ${err.message}`))
        .save(outputPath),
    );
  }

  async startVideoStream(
    res: Response,
    req: Request,
    filePath: string,
  ): Promise<void> {
    const stat = statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const stream = createReadStream(filePath, { start, end });
      const contentLength = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': VIDEO_CONTENT_TYPE,
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': VIDEO_CONTENT_TYPE,
      });

      createReadStream(filePath).pipe(res);
    }
  }

  async handleVideoUploading(video: Express.Multer.File): Promise<{
    convertedVideoPath: string;
    optimisedFilePath: string;
  }> {
    const videoPath = video.path;
    const mp4FileName = video.filename.replace(/\.[^/.]+$/, `.mp4`);
    const outputPath = path.join(VIDEO_FILE_DESTINATION, mp4FileName);

    await this.convertToMp4(videoPath, outputPath);

    const optimisedFilePath = await this.compressForPreview(outputPath);

    return {
      convertedVideoPath: mp4FileName,
      optimisedFilePath,
    };
  }
}
