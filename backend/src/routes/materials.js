import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";
import { requireRole } from "../lib/requireRole.js";
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, DeleteObjectCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";
import path from "path";

const M_ENDPOINT   = process.env.MINIO_ENDPOINT || "minio";
const M_PORT       = process.env.MINIO_PORT     || "9000";
const M_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
const M_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";
const M_SECURE     = process.env.MINIO_USE_SSL === "true";
const BUCKET_NAME  = process.env.MINIO_BUCKET_NAME || "materiais";

const s3Client = new S3Client({
  endpoint: `${M_SECURE ? "https" : "http"}://${M_ENDPOINT}:${M_PORT}`,
  region: "us-east-1",
  credentials: { accessKeyId: M_ACCESS_KEY, secretAccessKey: M_SECRET_KEY },
  forcePathStyle: true,
});

const adminOrMentor = (app) => requireRole(app, "ADMIN", "MENTORA");

async function ensureBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (err) {
    if (err.name === "NotFound" || err.name === "NoSuchBucket" || err.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      
      // Define política pública de leitura para o bucket
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify(policy)
      }));
      console.log(`✅ Bucket ${BUCKET_NAME} criado com política pública.`);
    } else throw err;
  }
}

async function uploadToMinio(buffer, filename, mimetype) {
  await ensureBucket();
  const key = `${Date.now()}-${filename}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME, Key: key, Body: buffer, ContentType: mimetype,
  }));
  
  // Se houver uma URL pública definida (para o browser acessar), usa ela. 
  // Caso contrário, usa a interna (útil apenas para o backend).
  const publicBase = process.env.MINIO_PUBLIC_URL || `${M_SECURE ? "https" : "http"}://${M_ENDPOINT}:${M_PORT}`;
  
  return {
    key,
    url: `${publicBase}/${BUCKET_NAME}/${key}`,
  };
}

/**
 * CRUD de Materiais de Apoio
 * Prefixo: /api/materials
 */
export async function materialRoutes(app) {
  // ── GET / — lista todos os materiais ────────────────────────────────────────
  app.get("/", async (_req, reply) => {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
      include: { files: true },
    });
    return reply.send(materials);
  });

  // ── GET /:id — busca material por ID ────────────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const material = await prisma.material.findUnique({
      where: { id: Number(req.params.id) },
      include: { files: true },
    });
    if (!material) return reply.status(404).send({ message: "Material não encontrado." });
    return reply.send(material);
  });

  // ── POST / — cria material com múltiplos arquivos ────────────────────────────
  app.post("/", { onRequest: [adminOrMentor(app)] }, async (req, reply) => {
    try {
      console.log("📥 [Materials] Iniciando upload...");
      const parts = req.parts();
      const fields = {};
      const uploadedFiles = [];

      for await (const part of parts) {
        if (part.file) {
          console.log(`  📄 Arquivo: ${part.filename} (${part.mimetype})`);
          try {
            const buffer = await part.toBuffer();
            const { key, url } = await uploadToMinio(buffer, part.filename, part.mimetype);
            uploadedFiles.push({ fileName: part.filename, fileUrl: url, key });
            console.log(`    ✅ Upload OK: ${key}`);
          } catch (err) {
            console.error(`    ❌ Erro MinIO (${part.filename}):`, err);
            throw err;
          }
        } else {
          fields[part.fieldname] = part.value;
          console.log(`  field: ${part.fieldname} = ${part.value}`);
        }
      }

      const title       = fields.title       || "Material sem título";
      const description = fields.description || "";
      const category    = fields.category    || "Geral";
      const type        = fields.type        || "Guia";

      console.log(`💾 Salvando no DB: "${title}"...`);

      const material = await prisma.material.create({
        data: {
          title, description, category, type,
          fileUrl: uploadedFiles[0]?.fileUrl ?? null,
          files: {
            create: uploadedFiles.map(({ fileName, fileUrl }) => ({ fileName, fileUrl })),
          },
        },
        include: { files: true },
      });

      await logActivity(`Novo material publicado: "${title}" (${uploadedFiles.length} arquivo(s))`);
      console.log("✨ Sucesso no upload!");
      return reply.status(201).send(material);
    } catch (error) {
      console.error("💥 Erro no POST /api/materials:", error);
      return reply.status(500).send({ message: error.message || "Erro ao realizar upload do material." });
    }
  });

  // ── DELETE /:id/files/:fileId — remove um arquivo específico ────────────────
  app.delete("/:id/files/:fileId", { onRequest: [adminOrMentor(app)] }, async (req, reply) => {
    const fileId = Number(req.params.fileId);
    try {
      console.log(`🗑 [Materials] Removendo arquivo individual: ${fileId}...`);
      const file = await prisma.materialFile.findUnique({ where: { id: fileId } });
      if (!file) return reply.status(404).send({ message: "Arquivo não encontrado." });

      // Tenta remover do MinIO (extrai a key da URL)
      try {
        const urlSegments = file.fileUrl.split(`/${BUCKET_NAME}/`);
        if (urlSegments.length > 1) {
          const key = urlSegments[1];
          await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
          console.log(`    ✅ Removido do MinIO: ${key}`);
        }
      } catch (err) {
        console.warn(`    ⚠️ Falha ao remover do MinIO (ignorado):`, err.message);
      }

      await prisma.materialFile.delete({ where: { id: fileId } });
      console.log("    ✅ Removido do banco.");
      return reply.status(204).send();
    } catch (error) {
      console.error("💥 Erro ao deletar arquivo:", error);
      return reply.status(500).send({ message: "Erro interno ao deletar arquivo." });
    }
  });

  // ── POST /:id/files — anexa novos arquivos a um material existente ────────
  app.post("/:id/files", { onRequest: [adminOrMentor(app)] }, async (req, reply) => {
    const materialId = Number(req.params.id);
    try {
      console.log(`📥 [Materials] Anexando arquivos ao material ${materialId}...`);
      const parts = req.parts();
      const uploadedFiles = [];

      for await (const part of parts) {
        if (part.file) {
          const buffer = await part.toBuffer();
          const { url } = await uploadToMinio(buffer, part.filename, part.mimetype);
          uploadedFiles.push({ fileName: part.filename, fileUrl: url });
        }
      }

      if (uploadedFiles.length === 0) {
        return reply.status(400).send({ message: "Nenhum arquivo enviado." });
      }

      const files = await prisma.materialFile.createMany({
        data: uploadedFiles.map(f => ({
          materialId,
          fileName: f.fileName,
          fileUrl: f.fileUrl
        }))
      });

      console.log(`✅ Adicionados ${uploadedFiles.length} arquivos ao material ${materialId}`);
      return reply.status(201).send({ message: "Arquivos adicionados com sucesso.", count: uploadedFiles.length });
    } catch (error) {
      console.error("💥 Erro ao anexar arquivos:", error);
      return reply.status(500).send({ message: "Erro ao anexar arquivos ao material." });
    }
  });

  // ── PUT /:id — atualiza metadados do material ────────────────────────────────
  app.put("/:id", {
    onRequest: [adminOrMentor(app)],
    schema: {
      body: {
        type: "object",
        properties: {
          title:       { type: "string" },
          description: { type: "string" },
          category:    { type: "string" },
          type:        { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const id = Number(req.params.id);
    const { title, description, category, type } = req.body;

    const data = {};
    if (title       !== undefined) data.title       = title;
    if (description !== undefined) data.description = description;
    if (category    !== undefined) data.category    = category;
    if (type        !== undefined) data.type        = type;

    try {
      console.log(`📝 [Materials] Atualizando metadados do material ${id}...`);
      const material = await prisma.material.update({ where: { id }, data, include: { files: true } });
      return reply.send(material);
    } catch (error) {
      console.error("💥 Erro no PUT materials:", error);
      return reply.status(404).send({ message: "Material não encontrado." });
    }
  });

  // ── DELETE /:id — remove material ───────────────────────────────────────────
  app.delete("/:id", { onRequest: [adminOrMentor(app)] }, async (req, reply) => {
    const id = Number(req.params.id);
    try {
      console.log(`🗑 [Materials] Removendo material completo: ${id}...`);
      
      // Busca arquivos para tentar limpar o MinIO antes de deletar o material (cascade remove do DB)
      const files = await prisma.materialFile.findMany({ where: { materialId: id } });
      for (const f of files) {
        try {
          const key = f.fileUrl.split(`/${BUCKET_NAME}/`)[1];
          if (key) await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
        } catch { /* ignora */ }
      }

      const material = await prisma.material.delete({ where: { id } });
      await logActivity(`Material removido: "${material.title}"`);
      console.log(`  ✅ Material "${material.title}" removido com sucesso.`);
      return reply.status(204).send();
    } catch (error) {
      console.error("💥 Erro ao deletar material:", error);
      return reply.status(500).send({ message: "Erro ao excluir material. Verifique se ele ainda existe." });
    }
  });
}
