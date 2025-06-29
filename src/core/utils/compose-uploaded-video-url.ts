import { SERVER_PATH } from "../constants";

export const composeUploadedVideoUrl = (filename: string) => `${SERVER_PATH}/api/videos/${filename}`;