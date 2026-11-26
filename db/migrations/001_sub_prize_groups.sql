-- Sub prizes get their own sets ("ชุดที่ N"), like main prizes.
-- Safe to run once on an existing gift23 database. Existing sub prizes move to set 1.

CREATE TABLE IF NOT EXISTS `group_sub` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `datagroup` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_datagroup` (`datagroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `gif_sub` ADD COLUMN `datagroup` INT NOT NULL DEFAULT 1 AFTER `giftname`;
ALTER TABLE `gif_sub` ADD KEY `idx_datagroup` (`datagroup`);

INSERT IGNORE INTO `group_sub` (datagroup) SELECT DISTINCT datagroup FROM `gif_sub`;

-- Carry the old "show all sub prizes on Live" switch over to set 1.
INSERT INTO settings (setting_key, setting_value)
SELECT 'live_show_sub_group_1', setting_value FROM settings WHERE setting_key = 'live_show_sub'
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
