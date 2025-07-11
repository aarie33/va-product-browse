import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  geminiApiKey: process.env.GOOGLE_API_KEY,
  
  chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
  collectionName: process.env.COLLECTION_NAME || 'va_knowledge_base',
  
  maxRetrievalResults: 5,
  similarityThreshold: 0.7,
  
  maxTokens: 1000,
  temperature: 0.7,
};

const requiredEnvVars = ['GOOGLE_API_KEY'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}