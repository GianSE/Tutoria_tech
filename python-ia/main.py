from fastapi import FastAPI
from ia_rose import router as ia_rose_router
from process_files import router as process_files_router

app = FastAPI(title="Tutoria Tech IA Brain")

app.include_router(ia_rose_router)
app.include_router(process_files_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Python IA Brain"}
