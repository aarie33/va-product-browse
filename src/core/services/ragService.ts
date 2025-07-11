import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { vectorStoreManager } from '../../loaders/vectorStore';
import { config } from '../../config';

export interface ChatResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: any;
    score?: number;
  }>;
  processingTime: number;
}

export class RAGService {
  private llm: ChatGoogleGenerativeAI;

  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      apiKey: config.geminiApiKey,
      model: 'gemini-1.5-flash',
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });
  }

  async processQuery(query: string): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      const relevantDocs = await vectorStoreManager.similaritySearch(
        query,
        config.maxRetrievalResults
      );

      const context = relevantDocs
        .map((doc, index) => `[${index + 1}] ${doc.pageContent}`)
        .join('\n\n');

      const prompt = this.createPrompt(query, context);

      const response = await this.llm.invoke(prompt, {
        configurable: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
        }
      });
      
      const processingTime = Date.now() - startTime;

      return {
        answer: response.content as string,
        sources: relevantDocs.map(doc => ({
          content: doc.pageContent,
          metadata: doc.metadata,
        })),
        processingTime,
      };
    } catch (error) {
      console.error('Error in RAG processing:', error);
      throw new Error('Failed to process query');
    }
  }

  private createPrompt(query: string, context: string): string {
    return `Anda adalah asisten virtual yang membantu pengguna dengan informasi produk dan layanan.

KONTEKS INFORMASI:
${context}

PERTANYAAN PENGGUNA:
${query}

INSTRUKSI:
1. Gunakan informasi dari konteks di atas untuk menjawab pertanyaan
2. Berikan jawaban yang akurat dan informatif dalam bahasa Indonesia
3. Jika informasi tidak tersedia dalam konteks, katakan bahwa Anda tidak memiliki informasi tersebut
4. Berikan jawaban yang ramah dan profesional
5. Jika perlu, berikan rekomendasi atau saran yang relevan

JAWABAN:`;
  }

  async getHealthStatus(): Promise<{ status: string; details: any }> {
    try {
      const testQuery = await vectorStoreManager.similaritySearch("test", 1);
      
      return {
        status: 'healthy',
        details: {
          vectorStore: 'connected',
          documentsCount: testQuery.length >= 0 ? 'available' : 'empty',
          llm: 'connected',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

export const ragService = new RAGService();