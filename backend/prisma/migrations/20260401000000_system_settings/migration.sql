-- ─── Migration: system_settings ─────────────────────────────────────────────

CREATE TABLE `system_settings` (
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `key`       VARCHAR(120) NOT NULL,
    `value`     TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `system_settings_key_key`(`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
