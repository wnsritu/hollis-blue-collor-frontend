import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export const usePhotoUpload = (maxPhotos: number = 5) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const createdUrls = useRef<string[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      createdUrls.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (photos.length + files.length > maxPhotos) {
      toast.error(`You can upload maximum ${maxPhotos} images`);
      return;
    }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB`);
        return;
      }
      validFiles.push(file);
      const url = URL.createObjectURL(file);
      previews.push(url);
      createdUrls.current.push(url);
    });

    setPhotos((prev) => [...prev, ...validFiles]);
    setPhotoPreviews((prev) => [...prev, ...previews]);
  };

  const handleRemovePhoto = (index: number) => {
    const urlToRemove = photoPreviews[index];
    if (urlToRemove) {
      URL.revokeObjectURL(urlToRemove);
      createdUrls.current = createdUrls.current.filter((url) => url !== urlToRemove);
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearPhotos = () => {
    createdUrls.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrls.current = [];
    setPhotos([]);
    setPhotoPreviews([]);
  };

  return {
    photos,
    photoPreviews,
    setPhotos,
    setPhotoPreviews,
    handlePhotoSelect,
    handleRemovePhoto,
    clearPhotos,
  };
};
