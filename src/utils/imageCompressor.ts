import imageCompression from 'browser-image-compression';
import { showError } from './toast';

const options = {
  maxSizeMB: 0.3, // Target 300 KB
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp', // Convert to WebP format
};

export const compressImage = async (file: File): Promise<File> => {
  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed image successfully: ${file.name}`);
    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    showError('Image compression failed. Please try a different image.');
    console.error('Compression Error:', error);
    throw error;
  }
};