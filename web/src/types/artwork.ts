export interface Artwork {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl: string;
  likes: number;
  createdAt: string;
}

export interface CreateArtworkDto {
  title: string;
  author: string;
  description: string;
  category?: string;
  tags?: string[];
}

export interface ArtworkQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: 'newest' | 'oldest' | 'popular';
}

export interface PaginatedArtworks {
  artworks: Artwork[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RawArtworkRecord {
  id?: string;
  title?: string;
  author?: string;
  description?: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  likes?: number;
  createdAt?: string;
}

export interface ArtworkStats {
  totalArtworks: number;
  totalLikes: number;
  totalArtists: number;
  categoryCounts: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

