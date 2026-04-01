-- ─── Migration: knowledge_documents ─────────────────────────────────────────

CREATE TABLE `knowledge_documents` (
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `filename`  VARCHAR(255) NOT NULL,
    `content`   LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
