import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import { ChromaClient, Collection } from 'chromadb';
import { config } from '../config';

export class VectorStoreManager {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private chromaClient: ChromaClient;
  private collection: Collection | null = null;

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.geminiApiKey,
      model: 'embedding-001',
    });
    
    const url = new URL(config.chromaUrl);
    this.chromaClient = new ChromaClient({
      host: url.hostname,
      port: parseInt(url.port) || 8000,
    });
  }

  async initialize(): Promise<void> {
    try {
      const collections = await this.chromaClient.listCollections();
      const collectionExists = collections.some(
        (col: any) => col.name === config.collectionName
      );

      if (collectionExists) {
        this.collection = await this.chromaClient.getCollection({
          name: config.collectionName,
        });
      } else {
        console.log(`Creating collection: ${config.collectionName}`);
        this.collection = await this.chromaClient.createCollection({
          name: config.collectionName,
          metadata: {
            'hnsw:space': 'cosine',
          },
        });
      }

      console.log('Vector store initialized successfully');
    } catch (error) {
      console.error('Error initializing vector store:', error);
      throw error;
    }
  }

  async addDocuments(documents: Array<{ content: string; metadata: any }>): Promise<void> {
    if (!this.collection) {
      throw new Error('Vector store not initialized');
    }

    try {
      const embeddings = await this.embeddings.embedDocuments(
        documents.map(doc => doc.content)
      );

      const ids = documents.map((_, index) => `doc_${Date.now()}_${index}`);
      const metadatas = documents.map(doc => doc.metadata);
      const documents_content = documents.map(doc => doc.content);

      await this.collection.add({
        ids: ids,
        embeddings: embeddings,
        metadatas: metadatas,
        documents: documents_content,
      });

      console.log(`Added ${documents.length} documents to vector store`);
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  async similaritySearch(query: string, k: number = config.maxRetrievalResults): Promise<Document[]> {
    if (!this.collection) {
      throw new Error('Vector store not initialized');
    }

    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: k,
        include: ['documents', 'metadatas', 'distances'],
      });

      const documents: Document[] = [];
      
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          const doc = results.documents[0][i];
          const metadata = results.metadatas?.[0]?.[i] || {};
          const distance = results.distances?.[0]?.[i] || 0;
          
          documents.push(new Document({
            pageContent: doc || '',
            metadata: {
              ...metadata,
              score: 1 - distance,
            },
          }));
        }
      }

      return documents;
    } catch (error) {
      console.error('Error performing similarity search:', error);
      throw error;
    }
  }

  async getCollectionInfo(): Promise<{ count: number; name: string }> {
    if (!this.collection) {
      throw new Error('Vector store not initialized');
    }

    try {
      const count = await this.collection.count();
      return {
        count,
        name: config.collectionName,
      };
    } catch (error) {
      console.error('Error getting collection info:', error);
      throw error;
    }
  }
}

export const vectorStoreManager = new VectorStoreManager();
