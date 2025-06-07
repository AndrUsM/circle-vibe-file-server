import * as sharp from 'sharp';
import { OPTIMISED_IMAGE_WIDTH_IN_PX } from '../constants';
import { composeOptimisedFilePath } from 'src/core';


export const imageGifOptimizationOptions = (filePath: string) =>
  sharp(filePath)
    .resize(OPTIMISED_IMAGE_WIDTH_IN_PX)
    .toFormat('webp', { quality: 85, compressionLevel:9 })
    .toFile(composeOptimisedFilePath(filePath));
