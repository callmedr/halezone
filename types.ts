
export interface Post {
  id: any;
  created_at: string;
  title: string;
  content: string;
  image_url: string | null;
}

export type RequestStatus = 'PENDING' | 'REVIEWING' | 'COMPLETED';

export interface BlogRequest {
  id: any;
  created_at: string;
  content: string;
  status: RequestStatus;
  post_id: any | null;
}

export type ViewState = 'MAIN' | 'LAB' | 'LIST' | 'DETAIL' | 'WRITE' | 'EDIT' | 'LOGIN';