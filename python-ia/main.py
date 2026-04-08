from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import boto3
import os
import google.generativeai as genai
import psycopg2

app = FastAPI(title="Tutoria Tech IA Brain")

# Modelos esperados no Body (JSON)
class ProcessRequest(BaseModel):
    file_name: str
    gemini_api_key: str

class ChatRequest(BaseModel):
    question: str
    gemini_api_key: str
    system_prompt: str = ""
    history: list = []
    context_strategy: str = "TBD"  # Estratégia de contexto ou ID para a busca vetorizada

# Configurações do MinIO
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "materiais")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

DB_URL = os.getenv("DB_URL")

# Cliente MinIO (via Boto3/S3)
s3_client = boto3.client(
    's3',
    endpoint_url=f"http://{MINIO_ENDPOINT}" if not MINIO_SECURE else f"https://{MINIO_ENDPOINT}",
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    region_name='us-east-1' # Região padrão fictícia pro Boto3 funcionar local
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Python IA Brain"}

@app.post("/process")
def process_file(req: ProcessRequest):
    """
    Simulação do fluxo de processamento de materiais:
    1. Baixa o arquivo do MinIO (usando file_name).
    2. Extrai texto (ex: pypdf).
    3. Vetoriza o conteúdo.
    4. Salva no banco de dados com pgvector.
    """
    try:
        # Exemplo de download (descomente e ajuste no futuro):
        # response = s3_client.get_object(Bucket=MINIO_BUCKET_NAME, Key=req.file_name)
        # file_content = response['Body'].read()
        
        # Aqui ficará sua lógica para text extraction e chamadas de embedding...
        
        return {
            "status": "success", 
            "message": f"Arquivo {req.file_name} recebido da fila de processamento.",
            "api_key_recebida_seguramente": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat(req: ChatRequest):
    """
    1. Recebe a pergunta e chave API.
    2. Busca o contexto relevante no pgvector utilizando query de similaridade.
    3. Formula o prompt e envia para o Gemini.
    """
    try:
        # Configurar cliente localmente, na requisição
        genai.configure(api_key=req.gemini_api_key)
        
        # Injetar o system_prompt na inicialização do model
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=req.system_prompt if req.system_prompt else None
        )
        
        # Converter o histórico pra o formato suportado pelo SDK de Python (genai)
        formatted_history = []
        for msg in req.history:
            role = "user" if msg.get("role") == "user" else "model"
            
            # Tenta pegar text das parts, se não exisitr pega o text direto
            text_part = ""
            if "parts" in msg and len(msg["parts"]) > 0:
                text_part = msg["parts"][0].get("text", "")
            else:
                text_part = msg.get("text", "")
                
            formatted_history.append({"role": role, "parts": [text_part]})
            
        chat_session = model.start_chat(history=formatted_history)
        
        # Placeholder para Lógica de RAG:
        # Recuperar os 'embeddings' semelhantes a req.question do banco
        
        prompt_with_context = f"{req.question}"
        
        response = chat_session.send_message(prompt_with_context)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
