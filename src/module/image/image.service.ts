import { Injectable } from '@nestjs/common';
import { imageJpgOptimizationOptions, imagePngOptimizationOptions, imageGifOptimizationOptions, imageWebPOptimizationOptions } from './utils';
import { ALLOWED_IMAGE_FORMATS } from './constants';

@Injectable()
export class ImageService {
  async uploadOptimisedImage(filePath: string): Promise<void> {
    if (/(jpg|jpeg)$/.test(filePath)) {
      await imageJpgOptimizationOptions(filePath);
      return;
    }

    if (/(png)$/.test(filePath)) {
      await imagePngOptimizationOptions(filePath);
      return;
    }

    if (/(gif)$/.test(filePath)) {
      await imageGifOptimizationOptions(filePath);
      return;
    }

    if (/(webp)$/.test(filePath)) {
      await imageWebPOptimizationOptions(filePath);
      return;
    }

    throw new Error(`Unsupported image format. Supported: ${ALLOWED_IMAGE_FORMATS.join(', ')} are allowed.`);
  }
}
