-- ─── Migration: ai_architecture_cleanup ─────────────────────────────────────

-- 1) Expandir SystemSetting.value para LONGTEXT
ALTER TABLE `system_settings`
  MODIFY COLUMN `value` LONGTEXT NOT NULL;

-- 2) Adicionar updatedAt em knowledge_documents
ALTER TABLE `knowledge_documents`
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- 3) Criar analytics de chat
CREATE TABLE `chat_analytics` (
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `question`  TEXT NOT NULL,
    `role`      VARCHAR(50) NOT NULL DEFAULT 'ALUNA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
