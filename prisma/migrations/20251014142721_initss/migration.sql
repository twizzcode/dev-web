-- AlterTable
ALTER TABLE `TemplateCategory` MODIFY `description` TEXT NULL,
    MODIFY `imageUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `TemplateLink` MODIFY `url` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `TemplateProduct` MODIFY `description` TEXT NOT NULL,
    MODIFY `imageUrl` TEXT NOT NULL;
