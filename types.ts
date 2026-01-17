
export interface Post {
  id: string;
  created_at: string;
  title: string;
  content: string;
  image_url: string | null;
}

export type ViewState = 'LIST' | 'DETAIL' | 'WRITE' | 'EDIT' | 'LOGIN';
