import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { Response, Request } from 'express';
import {
  VIDEO_FILE_SIZE_LIMIT_IN_BYTES,
} from './constants';
import { VideoService } from './video.service';
import { FileEntityType } from '@prisma/client';
import { BucketService } from '@core/services';
import { FileInterceptorWithRequestParams } from '@core/interceptors';

@Controller('videos')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly bucketService: BucketService,
  ) {}

  @Get(':filename')
  async streamVideo(
    @Param('filename') filename: string,
    @Query('bucket') bucket: string,

    @Req() req: Request,
    @Res() res: Response,
  ) {
    const filePath = await this.bucketService.getFilePath({
      bucket,
      entityType: FileEntityType.VIDEO,
      filename,
    });

    if (!filePath) {
      res.sendStatus(400);
      return;
    }

    const isFileExists = existsSync(filePath);

    if (!isFileExists) {
      res.sendStatus(404);
      return;
    }

    await this.videoService.startVideoStream(res, req, filePath);
  }

  @Delete(':filename')
  @HttpCode(200)
  async deleteVidep(
    @Param('filename') filename: string,
    @Query('bucket') bucket: string,
  ) {
    return this.bucketService.deleteFile({
      bucket,
      entityType: FileEntityType.VIDEO,
      filename,
    });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptorWithRequestParams('video', FileEntityType.VIDEO, () => ({
      limits: {
        fileSize: VIDEO_FILE_SIZE_LIMIT_IN_BYTES,
      },
    })),
  )
  async uploadVideo(@UploadedFile() video: Express.Multer.File) {
    if (!video) {
      throw new BadRequestException('Video file is required!');
    }

    if (video?.size && video?.size > VIDEO_FILE_SIZE_LIMIT_IN_BYTES) {
      throw new BadRequestException('Video file is too large!');
    }

    const baseFileName = 'videos';

    const { convertedVideoPath, optimisedFilePath } =
      await this.videoService.handleVideoUploading(video);

    return {
      filePath: `${baseFileName}/${convertedVideoPath}`,
      optimisedFilePath: `${baseFileName}/${optimisedFilePath}`,
    };
  }
}
