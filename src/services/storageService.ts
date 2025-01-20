import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../firebase';

const storage = getStorage(app);

export const storageService = {
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  async uploadMultipleImages(files: File[], basePath: string): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) => {
        const path = `${basePath}/${Date.now()}_${index}_${file.name}`;
        return this.uploadImage(file, path);
      });
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  },

  async deleteImage(url: string): Promise<void> {
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  async deleteMultipleImages(urls: string[]): Promise<void> {
    try {
      const deletePromises = urls.map(url => this.deleteImage(url));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      throw error;
    }
  }
}; 