export interface ArtworkComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CreateCommentDto {
  author: string;
  text: string;
}

export interface Artwork {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl: string;
  likes: number;
  comments: ArtworkComment[];
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
  comments?: ArtworkComment[];
  createdAt?: string;
}

export interface ArtworkStats {
  totalArtworks: number;
  totalLikes: number;
  totalArtists: number;
  totalComments: number;
  categoryCounts: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

