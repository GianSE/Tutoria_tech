-- ─── Migration: expand_schema ─────────────────────────────────────────────────
-- Atualiza enum Role: TUTOR→MENTORA, ALUNO→ALUNA
-- Cria tabelas: teams, _TeamStudents, materials, schedules, activity_logs

-- 1. Alterar o enum Role na tabela users
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('ADMIN', 'MENTORA', 'ALUNA') NOT NULL DEFAULT 'ALUNA';

-- 2. Criar tabela teams
CREATE TABLE `teams` (
    `id`           INTEGER NOT NULL AUTO_INCREMENT,
    `name`         VARCHAR(120) NOT NULL,
    `thunkableUrl` VARCHAR(500) NULL,
    `status`       ENUM('IDEACAO','PROTOTIPAGEM','EM_DESENVOLVIMENTO','CONCLUIDO') NOT NULL DEFAULT 'IDEACAO',
    `mentorId`     INTEGER NOT NULL,
    `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Criar tabela de junção many-to-many Team <-> User (alunas)
CREATE TABLE `_TeamStudents` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,
    UNIQUE INDEX `_TeamStudents_AB_unique`(`A`, `B`),
    INDEX `_TeamStudents_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Criar tabela materials
CREATE TABLE `materials` (
    `id`          INTEGER NOT NULL AUTO_INCREMENT,
    `title`       VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `fileUrl`     VARCHAR(500) NULL,
    `category`    VARCHAR(100) NOT NULL DEFAULT 'Geral',
    `type`        VARCHAR(50)  NOT NULL DEFAULT 'Guia',
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Criar tabela schedules
CREATE TABLE `schedules` (
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `title`     VARCHAR(200) NOT NULL,
    `date`      DATETIME(3) NOT NULL,
    `local`     VARCHAR(200) NULL,
    `type`      ENUM('MENINAS_NO_LAB','RODA_DE_CONVERSA','SESSAO_DE_TUTORIA','TECHNOVATION_EVENT') NOT NULL DEFAULT 'SESSAO_DE_TUTORIA',
    `status`    ENUM('PENDENTE','REALIZADA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    `presencas` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. Criar tabela activity_logs
CREATE TABLE `activity_logs` (
    `id`          INTEGER NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(500) NOT NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. Foreign keys
ALTER TABLE `teams`
  ADD CONSTRAINT `teams_mentorId_fkey`
  FOREIGN KEY (`mentorId`) REFERENCES `users`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `_TeamStudents`
  ADD CONSTRAINT `_TeamStudents_A_fkey`
  FOREIGN KEY (`A`) REFERENCES `teams`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `_TeamStudents`
  ADD CONSTRAINT `_TeamStudents_B_fkey`
  FOREIGN KEY (`B`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
