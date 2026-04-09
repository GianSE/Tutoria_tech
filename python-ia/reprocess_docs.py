import psycopg2
import os
import time
import traceback
from process_files import process_knowledge, ProcessKnowledgeRequest

DB_URL = os.getenv("DB_URL")

def reprocess():
    print(f"--- Iniciando Reprocessamento ---")
    print(f"DB_URL: {DB_URL}")
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Get documents without chunks
        cur.execute("""
            SELECT d.id, d.filename 
            FROM knowledge_documents d
            LEFT JOIN knowledge_chunks c ON d.id = c."documentId"
            WHERE c.id IS NULL
        """)
        docs = list(set(cur.fetchall())) # Ensure unique
        
        # Get API Key
        cur.execute("SELECT value FROM system_settings WHERE key = 'GEMINI_API_KEY'")
        api_key_res = cur.fetchone()
        if not api_key_res:
            print("❌ ERRO: GEMINI_API_KEY não encontrada no banco.")
            return
        api_key = api_key_res[0]
        
        print(f"🔍 Encontrados {len(docs)} documentos pendentes.")
        
        for doc_id, filename in docs:
            print(f"🚀 Reprocessando ID {doc_id}: {filename}...")
            time.sleep(1) # Delay for rate limiting
            try:
                req = ProcessKnowledgeRequest(
                    document_id=doc_id,
                    file_name=filename,
                    gemini_api_key=api_key
                )
                res = process_knowledge(req)
                print(f"   ✅ Resultado: {res}")
                if res.get("status") == "error":
                    print(f"      ‼️ DETALHE DO ERRO: {res.get('message')}")
            except Exception:
                print(f"   ❌ Erro no processamento ID {doc_id}:")
                traceback.print_exc()
                
        cur.close()
        conn.close()
        print("--- Reprocessamento Concluído ---")
    except Exception:
        print(f"💥 Erro fatal:")
        traceback.print_exc()

if __name__ == "__main__":
    reprocess()
