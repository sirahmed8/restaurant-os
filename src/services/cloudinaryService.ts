/**
 * =====================================================================
 * RESTAURANT OS — CLOUDINARY MEDIA & CLOUD ASSET MANAGEMENT SERVICE
 * =====================================================================
 * Handles secure image uploads, smart transformations, and food photography optimization.
 */

export interface CloudinaryUploadResponse {
  publicId: string;
  secureUrl: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  thumbnailUrl: string;
}

export interface ImageTransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'thumb' | 'fit' | 'limit' | 'scale';
  quality?: 'auto' | 'auto:good' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
  roundedCorners?: number | 'max';
  blur?: number;
}

class CloudinaryService {
  private cloudName: string;
  private uploadFolder: string;

  constructor() {
    const env: Record<string, any> = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
    const procEnv: Record<string, any> = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env : {};

    this.cloudName = env.VITE_CLOUDINARY_CLOUD_NAME || procEnv.VITE_CLOUDINARY_CLOUD_NAME || 'dfvh4jcsh';
    this.uploadFolder = env.CLOUDINARY_FOLDER || procEnv.CLOUDINARY_FOLDER || 'restaurant_os';
  }

  /**
   * Upload an image (File, Blob, or base64 data URI) directly to Cloudinary.
   */
  public async uploadImage(
    fileOrBase64: File | Blob | string,
    subfolder = 'dishes'
  ): Promise<CloudinaryUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('upload_preset', 'ml_default'); // Unsigned default preset
      formData.append('folder', `${this.uploadFolder}/${subfolder}`);

      if (typeof fileOrBase64 === 'string') {
        formData.append('file', fileOrBase64);
      } else {
        formData.append('file', fileOrBase64);
      }

      const endpoint = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      const secureUrl = data.secure_url;
      const thumbnailUrl = this.getTransformedUrl(secureUrl, {
        width: 300,
        height: 300,
        crop: 'fill',
        quality: 'auto',
        format: 'auto',
      });

      return {
        publicId: data.public_id,
        secureUrl,
        url: data.url,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
        thumbnailUrl,
      };
    } catch (err) {
      console.warn('[Cloudinary Service] Upload to cloud failed. Falling back to local data URL:', err);
      
      // Local fallback for offline mode or demo
      let localUrl = '';
      if (typeof fileOrBase64 === 'string') {
        localUrl = fileOrBase64;
      } else {
        localUrl = URL.createObjectURL(fileOrBase64);
      }

      return {
        publicId: 'local_' + Date.now(),
        secureUrl: localUrl,
        url: localUrl,
        format: 'webp',
        width: 800,
        height: 600,
        bytes: 10240,
        thumbnailUrl: localUrl,
      };
    }
  }

  /**
   * Generate an optimized Cloudinary URL on the fly with transformations.
   */
  public getTransformedUrl(
    originalUrl: string,
    options: ImageTransformationOptions = {}
  ): string {
    if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
      return originalUrl;
    }

    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
      roundedCorners,
    } = options;

    const transforms: string[] = [`f_${format}`, `q_${quality}`];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop && (width || height)) transforms.push(`c_${crop}`);
    if (roundedCorners) transforms.push(`r_${roundedCorners}`);

    const transformString = transforms.join(',');

    // Insert transform string into Cloudinary URL path after /upload/
    return originalUrl.replace(/\/upload\/(v\d+\/)?/, `/upload/${transformString}/$1`);
  }
}

export const cloudinaryService = new CloudinaryService();
