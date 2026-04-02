import apiClient from '../api/client';

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  title_kinyarwanda: string;
  content: string;
  content_kinyarwanda: string;
  image_base64?: string;
  plant_name?: string;
  likes: number;
  comments_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  content_kinyarwanda: string;
  created_at: string;
}

// Create a community post
export const createPost = async (post: Partial<CommunityPost>): Promise<CommunityPost> => {
  const response = await apiClient.post('/community/posts', post);
  return response.data;
};

// Get community posts
export const getPosts = async (limit: number = 50): Promise<CommunityPost[]> => {
  const response = await apiClient.get('/community/posts', {
    params: { limit },
  });
  return response.data;
};

// Like a post
export const likePost = async (postId: string): Promise<void> => {
  await apiClient.post(`/community/posts/${postId}/like`);
};

// Add comment to post
export const addComment = async (
  postId: string,
  content: string,
  contentKinyarwanda: string = ''
): Promise<Comment> => {
  const response = await apiClient.post(`/community/posts/${postId}/comments`, null, {
    params: { content, content_kinyarwanda: contentKinyarwanda },
  });
  return response.data;
};

// Get comments for a post
export const getComments = async (postId: string): Promise<Comment[]> => {
  const response = await apiClient.get(`/community/posts/${postId}/comments`);
  return response.data;
};
