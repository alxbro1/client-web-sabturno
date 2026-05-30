# Local Images Module Documentation

## Overview

The Local Images Module allows business owners (locals) to upload, manage, and display images of their establishments.

## Data Types

### LocalImage
```typescript
interface LocalImage {
  id: number;
  url: string;
  image: string;
  description?: string;
  uploadedAt: string;
  localId: string;
}
```

### LocalWithImages
```typescript
interface LocalWithImages extends Local {
  images: LocalImage[];
}
```

### ImageUploadRequest
```typescript
interface ImageUploadRequest {
  uri: string;
  description?: string;
}
```

## API Endpoints

### GET `/local/{localId}/images`
Returns array of LocalImage objects for the specified local.

### POST `/local/{localId}/images`
Uploads a new image. Expects FormData with:
- `image`: File (multipart/form-data)
- `description`: string (optional)

### DELETE `/local/images/{imageId}`
Deletes the specified image.

## Hook Usage

### useLocalImages
Main hook for managing local images with CRUD operations.

```typescript
import { useLocalImages } from '@/features/local/hooks/useLocalImages';

function MyComponent() {
  const localId = '1';
  const {
    images,
    isLoading,
    error,
    uploadImage,
    deleteImage,
    refreshImages,
  } = useLocalImages(localId);
}
```

## Service Usage

### localImagesService
Direct service for API operations.

```typescript
import { localImagesService } from '@/features/local/services/localImages.service';

// Get images
const images = await localImagesService.getLocalImages(localId);

// Upload image
const newImage = await localImagesService.uploadLocalImage(localId, {
  uri: 'data:image/jpeg;base64,...',
  description: 'Image description',
});
```

## Image Utilities

### imageUploadUtils
Web-based utilities for image handling using browser APIs.

```typescript
import { imageUploadUtils } from '@/features/local/utils/imageUploadUtils';

// Pick from gallery
const result = await imageUploadUtils.pickImageFromGallery();

// Compress image
const compressedUri = await imageUploadUtils.compressImage(uri, {
  width: 800,
  height: 600,
  compress: 0.7,
});

// Generate thumbnail
const thumbnailUri = await imageUploadUtils.generateThumbnail(uri);
```

## Performance Optimizations

### Image Loading
- Lazy loading with placeholder images
- Progressive image loading
- Automatic compression on upload

### Memory Management
- Images are compressed before upload
- Multiple image sizes (thumbnail, medium, full)
- Proper cleanup of image references