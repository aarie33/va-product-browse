# Virtual Assistant for Product Browse

## Installation
- npm run install
- npm run digest
- npm run dev
  
## Requirement
- chromaDB
- Google AI (Gemini)

### ChromaDB Docker
Dockerfile
```
FROM python:3.11-slim

WORKDIR /app

RUN pip install chromadb uvicorn

EXPOSE 8000

CMD ["chroma", "run", "--host", "0.0.0.0", "--port", "8000"]
```

docker-compose.yml
```
services:
  chromadb:
    build: .
    container_name: chromadb_server
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/app/chroma

volumes:
  chroma_data:
```