export interface ImageCompressionOptions {
  compress?: number;
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ImagePickerResult {
  uri: string;
  cancelled: boolean;
  file?: File;
}

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const resizeImage = (img: HTMLImageElement, width: number, height: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const aspectRatio = img.width / img.height;
    let finalWidth = width;
    let finalHeight = height;

    if (aspectRatio > width / height) {
      finalHeight = width / aspectRatio;
    } else {
      finalWidth = height * aspectRatio;
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;
    ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

    resolve(canvas.toDataURL('image/jpeg', 0.8));
  });
};

export const imageUploadUtils = {
  requestCameraPermissions: async (): Promise<boolean> => {
    return true;
  },

  requestMediaLibraryPermissions: async (): Promise<boolean> => {
    return true;
  },

  pickImageFromCamera: async (): Promise<ImagePickerResult> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    return new Promise((resolve) => {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve({ uri: '', cancelled: true });
          return;
        }
        const uri = await readFileAsDataUrl(file);
        resolve({ uri, cancelled: false, file });
      };
      input.click();
    });
  },

  pickImageFromGallery: async (): Promise<ImagePickerResult> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    return new Promise((resolve) => {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve({ uri: '', cancelled: true });
          return;
        }
        const uri = await readFileAsDataUrl(file);
        resolve({ uri, cancelled: false, file });
      };
      input.click();
    });
  },

  compressImage: async (
    uri: string,
    options: ImageCompressionOptions = {}
  ): Promise<string> => {
    try {
      const {
        compress = 0.7,
        width = 800,
        height = 600,
      } = options;

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          const aspectRatio = img.width / img.height;
          let finalWidth = width;
          let finalHeight = height;

          if (aspectRatio > width / height) {
            finalHeight = width / aspectRatio;
          } else {
            finalWidth = height * aspectRatio;
          }

          canvas.width = finalWidth;
          canvas.height = finalHeight;
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

          const dataUrl = canvas.toDataURL('image/jpeg', compress);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(uri);
        img.src = uri;
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  },

  generateThumbnail: async (uri: string): Promise<string> => {
    return imageUploadUtils.compressImage(uri, {
      width: 150,
      height: 150,
      compress: 0.5,
    });
  },

  validateImage: (uri: string): { isValid: boolean; error?: string } => {
    if (!uri) {
      return { isValid: false, error: 'URI de imagen requerida' };
    }

    if (!uri.startsWith('data:') && !uri.startsWith('blob:')) {
      return { isValid: false, error: 'Formato de imagen no válido' };
    }

    return { isValid: true };
  },

  getImageVersions: async (uri: string) => {
    try {
      const [thumbnail, medium, full] = await Promise.all([
        imageUploadUtils.compressImage(uri, { width: 150, height: 150, compress: 0.5 }),
        imageUploadUtils.compressImage(uri, { width: 400, height: 300, compress: 0.7 }),
        imageUploadUtils.compressImage(uri, { width: 1200, height: 800, compress: 0.8 }),
      ]);

      return { thumbnail, medium, full };
    } catch (error) {
      console.error('Error generating image versions:', error);
      return { thumbnail: uri, medium: uri, full: uri };
    }
  },
};