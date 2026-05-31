/**
 * @deprecated Usa `prepareImageForUpload` desde `../lib/imageUpload`.
 */
import {
  prepareImageForUpload,
  prepareImagesForUpload,
  UPLOAD_MAX_BYTES,
} from '../lib/imageUpload'

export { UPLOAD_MAX_BYTES }
export const compressImageForUpload = prepareImageForUpload
export const compressImagesForUpload = prepareImagesForUpload
