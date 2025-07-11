import fs from 'fs';
import path from 'path';
import { vectorStoreManager } from '../loaders/vectorStore';

interface Document {
  content: string;
  metadata: {
    source: string;
    type: string;
    timestamp: string;
  };
}

class DataIngestion {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
  }

  async ingestAllData(): Promise<void> {
    console.log('Starting data ingestion...');
    
    try {
      await vectorStoreManager.initialize();
      
      const documents: Document[] = [];
      
      const faqPath = path.join(this.dataDir, 'faq.txt');
      if (fs.existsSync(faqPath)) {
        const faqContent = fs.readFileSync(faqPath, 'utf-8');
        documents.push(...this.processFAQ(faqContent));
      }
      
      const policyPath = path.join(this.dataDir, 'policy.txt');
      if (fs.existsSync(policyPath)) {
        const policyContent = fs.readFileSync(policyPath, 'utf-8');
        documents.push(...this.processPolicy(policyContent));
      }
      
      const productsPath = path.join(this.dataDir, 'products.json');
      if (fs.existsSync(productsPath)) {
        const productsContent = fs.readFileSync(productsPath, 'utf-8');
        documents.push(...this.processProducts(productsContent));
      }
      
      if (documents.length > 0) {
        await vectorStoreManager.addDocuments(documents);
        console.log(`Successfully ingested ${documents.length} documents`);
      } else {
        console.log('No documents found to ingest');
      }
      
    } catch (error) {
      console.error('Error during data ingestion:', error);
      throw error;
    }
  }

  private processFAQ(content: string): Document[] {
    const documents: Document[] = [];
    const sections = content.split(/\n\s*\n/);
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        documents.push({
          content: section.trim(),
          metadata: {
            source: 'faq.txt',
            type: 'faq',
            timestamp: new Date().toISOString(),
          },
        });
      }
    });
    
    return documents;
  }

  private processPolicy(content: string): Document[] {
    const documents: Document[] = [];
    const sections = content.split(/\n\s*\n/);
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        documents.push({
          content: section.trim(),
          metadata: {
            source: 'policy.txt',
            type: 'policy',
            timestamp: new Date().toISOString(),
          },
        });
      }
    });
    
    return documents;
  }

  private processProducts(content: string): Document[] {
    const documents: Document[] = [];
    
    try {
      const products = JSON.parse(content);
      
      if (Array.isArray(products)) {
        products.forEach((product, index) => {
          const productText = `Produk: ${product.name}
Deskripsi: ${product.description}
Harga: ${product.price}
Kategori: ${product.category}
Ketersediaan: ${product.availability ? 'Tersedia' : 'Tidak tersedia'}`;

          documents.push({
            content: productText,
            metadata: {
              source: 'products.json',
              type: 'product',
              timestamp: new Date().toISOString(),
            },
          });
        });
      }
    } catch (error) {
      console.error('Error parsing products JSON:', error);
    }
    
    return documents;
  }
}

if (require.main === module) {
  const ingestion = new DataIngestion();
  ingestion.ingestAllData()
    .then(() => {
      console.log('Data ingestion completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Data ingestion failed:', error);
      process.exit(1);
    });
}

export default DataIngestion;
