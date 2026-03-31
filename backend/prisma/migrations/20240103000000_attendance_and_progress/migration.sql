-- ─── Migration: attendance_and_progress ────────────────────────────────────────

-- 1. Criar tabela attendances (presenças por sessão)
CREATE TABLE `attendances` (
    `id`         INTEGER NOT NULL AUTO_INCREMENT,
    `scheduleId` INTEGER NOT NULL,
    `userId`     INTEGER NOT NULL,
    `createdAt`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `attendances_scheduleId_userId_key`(`scheduleId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Criar tabela student_progress (progresso individual por equipe)
CREATE TABLE `student_progress` (
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `teamId`    INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `stage`     ENUM('INICIO','DESENVOLVENDO','AVANCADO','CONCLUIDO') NOT NULL DEFAULT 'INICIO',
    `notes`     TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `student_progress_teamId_studentId_key`(`teamId`, `studentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Foreign keys para attendances
ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_scheduleId_fkey`
  FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `attendances`
  ADD CONSTRAINT `attendances_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Foreign keys para student_progress
ALTER TABLE `student_progress`
  ADD CONSTRAINT `student_progress_teamId_fkey`
  FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_progress`
  ADD CONSTRAINT `student_progress_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
