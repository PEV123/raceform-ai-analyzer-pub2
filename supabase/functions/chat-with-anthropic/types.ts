export interface Message {
  role: string;
  message: string;
}

export interface ProcessedDocument {
  source: {
    media_type: string;
    data: string;
  };
}