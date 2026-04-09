from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import google.generativeai as genai
import psycopg2

router = APIRouter()

DB_URL = os.getenv("DB_URL")

class ChatRequest(BaseModel):
    question: str
    gemini_api_key: str
    system_prompt: str = ""
    history: list = []
    context_strategy: str = "TBD"

@router.post("/chat")
def chat(req: ChatRequest):
    try:
        genai.configure(api_key=req.gemini_api_key)
        
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=req.system_prompt if req.system_prompt else None
        )
        
        formatted_history = []
        for msg in req.history:
            role = "user" if msg.get("role") == "user" else "model"
            text_part = ""
            if "parts" in msg and len(msg["parts"]) > 0:
                text_part = msg["parts"][0].get("text", "")
            else:
                text_part = msg.get("text", "")
            formatted_history.append({"role": role, "parts": [text_part]})
            
        chat_session = model.start_chat(history=formatted_history)
        
        contexto_rag = ""
        try:
            embed_res = genai.embed_content(
                model="models/gemini-embedding-2-preview",
                content=req.question,
                task_type="retrieval_query",
                output_dimensionality=768
            )
            query_embedding = embed_res['embedding']
            
            if DB_URL:
                conn = psycopg2.connect(DB_URL)
                cur = conn.cursor()
                vector_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
                
                cur.execute("""
                    SELECT content 
                    FROM knowledge_chunks 
                    ORDER BY embedding <=> %s::vector 
                    LIMIT 5
                """, (vector_str,))
                
                results = cur.fetchall()
                cur.close()
                conn.close()
                
                if results:
                    context_chunks = [row[0] for row in results]
                    contexto_rag = "\n\n".join(context_chunks)
        except Exception as rag_err:
            print("Erro ao recuperar contexto RAG:", rag_err)
        
        if contexto_rag:
            prompt_with_context = f"--- BASE DE CONHECIMENTO ---\n{contexto_rag}\n\nPergunta do usuário: {req.question}"
        else:
            prompt_with_context = f"{req.question}"
        
        response = chat_session.send_message(prompt_with_context)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
