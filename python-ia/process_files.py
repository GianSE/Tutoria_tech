from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
import os
import google.generativeai as genai
import psycopg2
import io
import re

from pypdf import PdfReader
from docx import Document as DocxDocument
import openpyxl

router = APIRouter()

class ProcessRequest(BaseModel):
    file_name: str
    gemini_api_key: str

class ProcessKnowledgeRequest(BaseModel):
    document_id: int
    file_name: str
    gemini_api_key: str

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "materiais")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

DB_URL = os.getenv("DB_URL")

s3_client = boto3.client(
    's3',
    endpoint_url=f"http://{MINIO_ENDPOINT}" if not MINIO_SECURE else f"https://{MINIO_ENDPOINT}",
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    region_name='us-east-1'
)

def chunk_text(text: str, min_length: int = 50) -> list[str]:
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'\n{4,}', '\n\n', text)
    chunks = [c.strip() for c in re.split(r'\n\n+', text) if len(c.strip()) >= min_length]
    return chunks

@router.post("/process")
def process_file(req: ProcessRequest):
    try:
        return {
            "status": "success", 
            "message": f"Arquivo {req.file_name} recebido da fila de processamento padrão."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process_knowledge")
def process_knowledge(req: ProcessKnowledgeRequest):
    try:
        response = s3_client.get_object(Bucket=MINIO_BUCKET_NAME, Key=req.file_name)
        file_bytes = response['Body'].read()
        
        text_content = ""
        lower_name = req.file_name.lower()
        
        if lower_name.endswith(".md") or lower_name.endswith(".txt") or lower_name.endswith(".csv"):
            text_content = file_bytes.decode("utf-8", errors="ignore")
        elif lower_name.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(file_bytes))
            parts = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    parts.append(extracted)
            text_content = "\n\n".join(parts)
        elif lower_name.endswith(".docx"):
            doc = DocxDocument(io.BytesIO(file_bytes))
            text_content = "\n\n".join([p.text for p in doc.paragraphs if p.text])
        elif lower_name.endswith(".xlsx"):
            wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
            for sheet in wb.worksheets:
                for row in sheet.iter_rows(values_only=True):
                    row_text = " ".join([str(cell) for cell in row if cell is not None])
                    if row_text:
                        text_content += row_text + "\n"
        else:
            return {"status": "error", "message": "Extensão não suportada"}

        if not text_content.strip():
            return {"status": "error", "message": "Nenhum texto extraído"}
        
        chunks = chunk_text(text_content)
        
        if not chunks:
            return {"status": "error", "message": "Texto insuficiente para chunking"}

        genai.configure(api_key=req.gemini_api_key)
        
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        for c in chunks:
            embed_res = genai.embed_content(
                model="models/gemini-embedding-2-preview",
                content=c,
                task_type="retrieval_document",
                output_dimensionality=768
            )
            embedding = embed_res['embedding']
            vector_str = "[" + ",".join(str(x) for x in embedding) + "]"
            
            cur.execute("""
                INSERT INTO knowledge_chunks (id, "documentId", content, embedding, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), %s, %s, %s::vector, NOW(), NOW())
            """, (req.document_id, c, vector_str))
            
        conn.commit()
        cur.close()
        conn.close()
        
        return {"status": "success", "chunks_criados": len(chunks)}

    except Exception as e:
        print(f"Erro crítico processando {req.file_name}: {e}")
        return {"status": "error", "message": str(e)}
