import * as sharp from 'sharp';
import { OPTIMISED_IMAGE_WIDTH_IN_PX } from '../constants';
import { composeOptimisedFilePath } from 'src/core';

export const imagePngOptimizationOptions = (filePath: string) =>
  sharp(filePath)
    .resize(OPTIMISED_IMAGE_WIDTH_IN_PX)
    .toFormat('jpeg', { quality: 80, compressionLevel: 9 })
    .toFile(composeOptimisedFilePath(filePath));
