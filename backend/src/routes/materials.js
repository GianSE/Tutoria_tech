import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Configuração do MinIO usando variáveis de ambiente
const M_ENDPOINT = process.env.MINIO_ENDPOINT || "minio";
const M_PORT = process.env.MINIO_PORT || "9000";
const M_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
const M_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";
const M_SECURE = process.env.MINIO_USE_SSL === "true";
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "materiais";

const s3Client = new S3Client({
  endpoint: `${M_SECURE ? "https" : "http"}://${M_ENDPOINT}:${M_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: M_ACCESS_KEY,
    secretAccessKey: M_SECRET_KEY,
  },
  forcePathStyle: true, // Necessário no MinIO
});

/**
 * CRUD de Materiais de Apoio
 * Prefixo: /api/materials
 */
export async function materialRoutes(app) {
  // ── GET / — lista todos os materiais ────────────────────────────────────────
  app.get("/", async (_req, reply) => {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
    });
    return reply.send(materials);
  });

  // ── GET /:id — busca material por ID ────────────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const material = await prisma.material.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!material) return reply.status(404).send({ message: "Material não encontrado." });
    return reply.send(material);
  });

  // ── POST / — cria material e salva arquivo fisicamente ───────────────────────
  app.post("/", async (req, reply) => {
    try {
      // 1. Receber e processar multipart/form-data
      const data = await req.file();
      if (!data) {
        return reply.status(400).send({ message: "Nenhum arquivo enviado na requisição." });
      }

      const buffer = await data.toBuffer();
      // Criar um nome único
      const fileName = `${Date.now()}-${data.filename}`;

      // Enviar para o MinIO
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: data.mimetype,
        })
      );

      // Obter detalhes dos demais campos (title, description, etc)
      const title = data.fields?.title?.value || "Material sem título";
      const description = data.fields?.description?.value || "";
      const category = data.fields?.category?.value || "Geral";
      const type = data.fields?.type?.value || "Guia";
      
      const fileUrl = `${M_SECURE ? "https" : "http"}://${M_ENDPOINT}:${M_PORT}/${BUCKET_NAME}/${fileName}`;

      // Salvar metadados no Postgres
      const material = await prisma.material.create({
        data: { title, description, fileUrl, category, type },
      });

      // 2. Buscar a GEMINI_API_KEY no banco de dados (tabela SystemSetting)
      const settings = await prisma.systemSetting.findUnique({
        where: { key: "GEMINI_API_KEY" },
      });
      const apiKey = settings?.value?.trim();

      // 3. Disparar um POST para http://python-ia:8000/process avisando a chegada e enviando a chave
      if (apiKey) {
        const pythonApiUrl = process.env.PYTHON_API_URL || "http://python-ia:8000";
        try {
          const pyRes = await fetch(`${pythonApiUrl}/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_name: fileName,
              gemini_api_key: apiKey
            }),
          });
          
          if (!pyRes.ok) {
             req.log.warn(`Aviso: Serviço python-ia retornou ${pyRes.status} para o arquivo ${fileName}`);
          }
        } catch (err) {
          req.log.error(err, "Falha ao enviar POST para python-ia com o novo material.");
        }
      } else {
        req.log.warn("GEMINI_API_KEY não encontrada no banco. Arquivo salvo, mas IA não notificada.");
      }

      await logActivity(`Novo material publicado: "${title}"`);
      return reply.status(201).send(material);
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ message: "Erro ao realizar upload do material." });
    }
  });

  // ── PUT /:id — atualiza material ─────────────────────────────────────────────
  app.put("/:id", {
    schema: {
      body: {
        type: "object",
        properties: {
          title:       { type: "string" },
          description: { type: "string" },
          fileUrl:     { type: "string" },
          category:    { type: "string" },
          type:        { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const id = Number(req.params.id);
    const { title, description, fileUrl, category, type } = req.body;

    const data = {};
    if (title       !== undefined) data.title       = title;
    if (description !== undefined) data.description = description;
    if (fileUrl     !== undefined) data.fileUrl     = fileUrl;
    if (category    !== undefined) data.category    = category;
    if (type        !== undefined) data.type        = type;

    try {
      const material = await prisma.material.update({ where: { id }, data });
      return reply.send(material);
    } catch {
      return reply.status(404).send({ message: "Material não encontrado." });
    }
  });

  // ── DELETE /:id — remove material ───────────────────────────────────────────
  app.delete("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    try {
      const material = await prisma.material.delete({ where: { id } });
      await logActivity(`Material removido: "${material.title}"`);
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Material não encontrado." });
    }
  });
}
