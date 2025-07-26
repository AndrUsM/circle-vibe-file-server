import { MessageFileEntityType } from "@circle-vibe/shared";

const BASE_PATH = '../../../uploads';

const VIDEOS_UPLOAD_PATH = `${BASE_PATH}/videos`;
const FILES_UPLOAD_PATH = `${BASE_PATH}/files`;
const IMAGES_UPLOAD_PATH = `${BASE_PATH}/images`;

export const composeFileGatewayUploadPath = (entityType: MessageFileEntityType) => {
  switch (entityType) {
    case MessageFileEntityType.VIDEO:
      return VIDEOS_UPLOAD_PATH;
    case MessageFileEntityType.IMAGE:
      return IMAGES_UPLOAD_PATH;
    case MessageFileEntityType.FILE:
      return FILES_UPLOAD_PATH;
    default:
      return FILES_UPLOAD_PATH;
  }
};