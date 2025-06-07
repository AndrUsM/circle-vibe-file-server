import { BadRequestException } from "@nestjs/common";
import { ALLOWED_IMAGE_FORMAT_REGEX } from "../constants";

/**
 * Filter for validating uploaded image files based on their MIME type.
 *
 * @param _req - The request object (not used in this function).
 * @param file - The file object representing the uploaded file.
 * @param callback - The function to call with the validation result.
 * @throws {BadRequestException} If the file type is not allowed.
 */

export const imageFileFilter = (_req, file: Express.Multer.File, callback: Function) => {
  if (!file.mimetype.match(ALLOWED_IMAGE_FORMAT_REGEX)) {
    return callback(new BadRequestException('Only image files are allowed!'), false);
  }
  callback(null, true);
};