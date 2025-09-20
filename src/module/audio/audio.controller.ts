import { Response } from 'express';
import * as fs from 'fs';

import { BucketService } from '@core/services';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptorWithRequestParams } from '@core/interceptors';
import { FILE_SIZE_LIMIT_IN_BYTES } from '@module/file/constants';
import { FileEntityType } from '@prisma/client';

@Controller('audio')
export class AudioController {
  constructor(private readonly bucketService: BucketService) {}

  @Get(':filename')
  async serveAudio(
    @Param('filename') filename: string,
    @Query('bucket') bucket: string,
    @Res() res: Response,
  ) {
    const filePath = await this.bucketService.getFilePath({
      bucket,
      entityType: FileEntityType.AUDIO,
      filename,
    });

    if (!filePath) {
      res.sendStatus(400);
      return;
    }

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.sendStatus(404);

        return;
      }

      res.sendFile(filePath);
    });
  }

  @Delete(':filename')
  @HttpCode(200)
  async deleteAudio(
    @Param('filename') filename: string,
    @Query('bucket') bucket: string,
  ) {
    this.bucketService.deleteFile({
      bucket,
      entityType: FileEntityType.AUDIO,
      filename,
    });
  }

  @Post('upload')
    @UseInterceptors(
      FileInterceptorWithRequestParams('audio', FileEntityType.AUDIO, () => ({
        limits: {
          fileSize: FILE_SIZE_LIMIT_IN_BYTES,
        },
      })),
    )
    async uploadAudio(@UploadedFile() file: Express.Multer.File) {
      if (!file) {
        throw new BadRequestException(
          'No file uploaded or file type not allowed',
        );
      }

      const baseFilePath = 'audio';
      const filePath = `${baseFilePath}/${file.filename}`;

      return {
        filePath,
      };
    }
}
