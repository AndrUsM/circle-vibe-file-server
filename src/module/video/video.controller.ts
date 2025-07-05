import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { modifyFileName, SERVER_PATH } from 'src/core';
import {
  VIDEO_FILE_DESTINATION,
  VIDEO_FILE_SIZE_LIMIT_IN_BYTES,
  VIDEO_STREAM_FILE_PATH,
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
    const filePath = join(__dirname, ...VIDEO_STREAM_FILE_PATH, filename);
    const isFileExists = existsSync(filePath);

    if (!isFileExists) {
      res.sendStatus(404);
      return;
    }

    await this.videoService.startVideoStream(res, req, filePath);
  }

  @Delete(':filename')
  @HttpCode(200)
  async deleteVidep(@Param('filename') filename: string) {
    const imagePath = join(__dirname, ...VIDEO_STREAM_FILE_PATH, filename);

    unlinkSync(imagePath);
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

    if (video?.size && video?.size > VIDEO_FILE_SIZE_LIMIT_IN_BYTES) {
      throw new BadRequestException('Video file is too large!');
    }

    const baseFileName = `${SERVER_PATH}/api/videos`;

    const { convertedVideoPath, optimisedFilePath } =
      await this.videoService.handleVideoUploading(video);

    return {
      filePath: `${baseFileName}/${convertedVideoPath}`,
      optimisedFilePath: `${baseFileName}/${optimisedFilePath}`,
    };
  }
}
