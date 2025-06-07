// video.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { createReadStream, statSync, existsSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { modifyFileName, SERVER_PATH } from 'src/core';
import {
  VIDEO_FILE_DESTINATION,
  VIDEO_FILE_SIZE_LIMIT_IN_BYTES,
} from './constants';
import { VideoService } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get(':filename')
  async streamVideo(
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const filePath = join(
      __dirname,
      '..',
      '..',
      '..',
      'uploads',
      'videos',
      filename,
    );
    const isFileExists = existsSync(filePath);

    if (!isFileExists) {
      res.sendStatus(404);
      return;
    }

    const stat = statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!isFileExists) {
      res.sendStatus(404);
      return;
    }

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
        'Content-Type': 'video/mp4',
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });

      createReadStream(filePath).pipe(res);
    }
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: VIDEO_FILE_SIZE_LIMIT_IN_BYTES,
      },
      storage: diskStorage({
        destination: VIDEO_FILE_DESTINATION,
        filename: modifyFileName,
      }),
    }),
  )
  async uploadVideo(@UploadedFile() video: Express.Multer.File) {
    if (!video) {
      throw new BadRequestException('Video file is required!');
    }

    const optimisedFilePath = await this.videoService.compressForPreview(
      video.path,
    );
    const baseFileName = `${SERVER_PATH}/api/videos`;

    // You can pass the file path or file details to a service to store in DB
    return {
      filePath: `${baseFileName}/${video.filename}`,
      optimisedFilePath: `${baseFileName}/${optimisedFilePath}`,
    };
  }
}
