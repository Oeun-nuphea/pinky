export interface Artwork {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

export interface CreateArtworkDto {
  title: string;
  author: string;
  description: string;
}

export interface RawArtworkRecord {
  id?: string;
  title?: string;
  author?: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
