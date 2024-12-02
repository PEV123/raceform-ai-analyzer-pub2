export interface ImageUploadState {
  previewUrl: string;
  publicUrl?: string;
  base64?: string;
  type: string;
}

export interface ImageUploadResult {
  publicUrl: string;
  base64: string;
  type: string;
}

export interface Message {
  role: 'user' | 'assistant';
  message: string;
}

export type ChatMessage = Message;

export interface ImageData {
  data: string;
  type: string;
}