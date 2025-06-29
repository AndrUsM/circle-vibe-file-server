import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Param,
  Get,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express, Response } from 'express';
import * as path  from 'path';
import * as fs from 'fs';

import { modifyFileName, imageFileFilter } from './utils';
import { ImageService } from './image.service';
import {
  IMAGE_FILE_PATH_DESTINATION,
} from './constants';
import { SERVER_PATH, UPLOAD_IMAGE_LIMIT_IN_BYTES } from 'src/core';
import { composeOptimizedImagesFileName } from './utils/compose-optimized-images-file-name';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get(':filename')
  async serveImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = path.join(__dirname, '..', '..', '..',  'uploads', 'images', filename);


    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.sendStatus(404);

        return;
      }

      res.sendFile(imagePath);
    });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: IMAGE_FILE_PATH_DESTINATION,
        filename: modifyFileName,
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: UPLOAD_IMAGE_LIMIT_IN_BYTES,
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
    if (!file) {
      throw new BadRequestException(
        'No file uploaded or file type not allowed',
      );
    }

    const baseFilePath = `${SERVER_PATH}/api/images`;
    const filePath = `${baseFilePath}/${file.filename}`;
    const optimisedFilePath = `${baseFilePath}/${composeOptimizedImagesFileName(file.filename)}`;

    await this.imageService.uploadOptimisedImage(file.path);

    return {
      filePath,
      optimisedFilePath,
    };
  }
}
