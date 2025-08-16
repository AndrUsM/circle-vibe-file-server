import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Param,
  Get,
  Res,
  Delete,
  HttpCode,
  Query,
} from '@nestjs/common';
import { Express, Response } from 'express';
import { FileEntityType } from '@prisma/client';
import * as fs from 'fs';

import { FileInterceptorWithRequestParams } from '@core/interceptors';
import { BucketService } from '@core/services';

import { imageFileFilter } from './utils';
import { ImageService } from './image.service';
import { UPLOAD_IMAGE_LIMIT_IN_BYTES } from 'src/core';
import { composeOptimizedImagesFileName } from './utils/compose-optimized-images-file-name';

@Controller('images')
export class ImageController {
  constructor(
    private readonly imageService: ImageService,
    private readonly bucketService: BucketService,
  ) {}

  @Get(':filename')
  async serveImage(
    @Param('filename') filename: string,
    @Query('bucket') bucket: string,
    @Res() res: Response,
  ) {
    const imagePath = await this.bucketService.getFilePath({
      bucket,
      entityType: FileEntityType.IMAGE,
      filename,
    });

    if (!imagePath) {
      res.sendStatus(400);
      return;
    }

    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.sendStatus(404);

        return;
      }

      res.sendFile(imagePath);
    });
  }

  @Delete(':filename')
  @HttpCode(200)
  async deleteVidep(
    @Param('filename') filename: string,
    @Query('bucket') bucket: string,
  ) {
    this.bucketService.deleteFile({
      bucket,
      entityType: FileEntityType.IMAGE,
      filename,
    });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptorWithRequestParams('image', FileEntityType.IMAGE, () => ({
      fileFilter: imageFileFilter,
      limits: {
        fileSize: UPLOAD_IMAGE_LIMIT_IN_BYTES,
      },
    })),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded or file type not allowed',
      );
    }

    const baseFilePath = 'images';
    const filePath = `${baseFilePath}/${file.filename}`;
    const optimisedFilePath = `${baseFilePath}/${composeOptimizedImagesFileName(file.filename)}`;

    await this.imageService.uploadOptimisedImage(file.path);

    return {
      filePath,
      optimisedFilePath,
    };
  }
}
