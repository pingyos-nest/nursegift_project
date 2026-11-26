-- NURSE GIFT — database schema (MySQL / MariaDB)
-- Core tables reconstructed from the queries the app runs; the rest from the original PHP project's sql/.
-- Usage: mysql -u <user> -p gift23 < db/schema.sql

SET NAMES utf8mb4;

-- Prize sets ("ชุดที่ N"); each set holds main prizes (gif_main) and sub prizes (gif_sub)
CREATE TABLE IF NOT EXISTS `group` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `datagroup` INT NOT NULL,
  `giftname` VARCHAR(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_datagroup` (`datagroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Main prizes
CREATE TABLE IF NOT EXISTS `gif_main` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `giftname` VARCHAR(500) NOT NULL,
  `datagroup` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_datagroup` (`datagroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Main prize winners (groupId → gif_main.id)
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `giftname` VARCHAR(500) DEFAULT NULL,
  `groupId` INT DEFAULT NULL,
  `dateCreate` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_groupId` (`groupId`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sub prizes (datagroup → `group`.datagroup, same sets as main prizes)
CREATE TABLE IF NOT EXISTS `gif_sub` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `giftname` VARCHAR(500) NOT NULL,
  `datagroup` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_datagroup` (`datagroup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sub prize winners (groupId → gif_sub.id)
CREATE TABLE IF NOT EXISTS `user_sub` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `giftname` VARCHAR(500) DEFAULT NULL,
  `groupId` INT DEFAULT NULL,
  `dateCreate` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_groupId` (`groupId`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SQL สำหรับสร้างตาราง activity_log
-- บันทึกประวัติการใช้งานระบบ

CREATE TABLE IF NOT EXISTS `activity_log` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_email` VARCHAR(255) NOT NULL COMMENT 'อีเมลผู้ใช้งาน',
    `action` VARCHAR(100) NOT NULL COMMENT 'การกระทำ เช่น add_gift, delete_gift',
    `description` TEXT COMMENT 'รายละเอียดเพิ่มเติม',
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_email` (`user_email`),
    KEY `idx_action` (`action`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SQL สำหรับสร้างตาราง backend_users (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS `backend_users` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL COMMENT 'CMU IT Account (email)',
    `name` VARCHAR(255) DEFAULT NULL COMMENT 'ชื่อ-นามสกุล',
    `role` ENUM('admin', 'user') DEFAULT 'user' COMMENT 'บทบาท',
    `status` TINYINT(1) DEFAULT 1 COMMENT '1 = เปิดใช้งาน, 0 = ปิดใช้งาน',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings Table for Live Display Configuration
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Default settings for live display
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('live_show_main', '1'),
('live_show_sub', '1')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;

-- SQL สำหรับสร้างตารางเก็บข้อมูลภาษา
-- รันคำสั่งนี้ทั้งใน local และ server

CREATE TABLE IF NOT EXISTS `languages` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `lang_code` VARCHAR(5) NOT NULL COMMENT 'รหัสภาษา เช่น th, en',
    `lang_key` VARCHAR(100) NOT NULL COMMENT 'key ของข้อความ เช่น nav_home',
    `lang_value` TEXT NOT NULL COMMENT 'ข้อความที่แปลแล้ว',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `lang_code_key` (`lang_code`, `lang_key`),
    KEY `idx_lang_code` (`lang_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Thai language data
INSERT INTO `languages` (`lang_code`, `lang_key`, `lang_value`) VALUES
-- Navbar
('th', 'nav_home', 'หน้าหลัก'),
('th', 'nav_live', 'ดูรางวัล'),
('th', 'nav_search', 'ตรวจสอบรางวัล'),
-- Index
('th', 'index_title_1', 'สถิตในดวงใจ ตราบนิจนิรันดร์ สานสัมพันธ์น้องพี่ FON CMU 2569'),
('th', 'index_title_2', 'A Tribute to Queen Sirikit of Thailand, Forever in Our Hearts: FON CMU Relationship Strengthening 2026'),
('th', 'index_live_title', 'Live Data'),
('th', 'index_live_desc', 'รางวัลที่กำลังแจก'),
('th', 'index_search_title', 'Search'),
('th', 'index_search_desc', 'ค้นหาของรางวัลของคุณ'),
-- Live Page
('th', 'live_title', 'รางวัลที่กำลังแจก'),
('th', 'live_status_connected', '🟢 เชื่อมต่อแล้ว'),
('th', 'live_status_disconnected', '🔴 ไม่สามารถเชื่อมต่อได้'),
('th', 'live_status_reconnecting', '🟡 กำลังเชื่อมต่อใหม่...'),
('th', 'live_error_title', 'เกิดข้อผิดพลาด'),
('th', 'live_error_desc', 'ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'),
('th', 'live_retry', 'ลองใหม่อีกครั้ง'),
('th', 'live_empty_title', 'ยังไม่มีรางวัลในขณะนี้'),
('th', 'live_empty_desc', 'รอสักครู่ รางวัลจะปรากฏที่นี่เมื่อมีการแจกจ่าย'),
('th', 'live_new_badge', 'ใหม่'),
-- Search Page
('th', 'search_header_title', 'ค้นหาของรางวัล'),
('th', 'search_header_subtitle', 'Search Prize Results'),
('th', 'search_card_title', 'ตรวจสอบรางวัลของคุณ'),
('th', 'search_placeholder', 'กรอกหมายเลขของคุณเพื่อค้นหา...'),
('th', 'search_button', 'ค้นหารางวัล'),
('th', 'search_tips_title', '💡 เคล็ดลับการค้นหา'),
('th', 'search_tips_desc', 'ระบบจะค้นหาทันทีที่คุณพิมพ์ (ขั้นต่ำ 4 ตัวอักษร)'),
('th', 'search_result_success_title', 'ยินดีด้วยคุณได้รับรางวัล!'),
('th', 'search_result_notfound_title', 'ไม่พบข้อมูลรางวัล'),
('th', 'search_warning_min_chars', 'กรุณากรอกข้อมูลอย่างน้อย 4 ตัวอักษร'),
('th', 'search_error_generic', 'เกิดข้อผิดพลาดในการค้นหา'),
('th', 'search_error_connection', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'),
-- Footer
('th', 'footer_copyright', 'Copyright © 2024 Faculty of Nursing Chiang Mai University. All rights reserved.'),
('th', 'footer_credit', 'Developed Communications and Branding Department')
ON DUPLICATE KEY UPDATE `lang_value` = `lang_value`; -- keep admin edits

-- Insert default English language data
INSERT INTO `languages` (`lang_code`, `lang_key`, `lang_value`) VALUES
-- Navbar
('en', 'nav_home', 'Home'),
('en', 'nav_live', 'Live Prizes'),
('en', 'nav_search', 'Check Prize'),
-- Index
('en', 'index_title_1', 'Happy New Year 2025'),
('en', 'index_title_2', 'New Year, New You, Together We''re Happy'),
('en', 'index_live_title', 'Live Data'),
('en', 'index_live_desc', 'Real-time Prize Feed'),
('en', 'index_search_title', 'Search'),
('en', 'index_search_desc', 'Check Your Prize Status'),
-- Live Page
('en', 'live_title', 'Live Prizes'),
('en', 'live_status_connected', '🟢 Connected'),
('en', 'live_status_disconnected', '🔴 Disconnected'),
('en', 'live_status_reconnecting', '🟡 Reconnecting...'),
('en', 'live_error_title', 'Error'),
('en', 'live_error_desc', 'Could not load data. Please check your internet connection.'),
('en', 'live_retry', 'Try Again'),
('en', 'live_empty_title', 'No prizes yet'),
('en', 'live_empty_desc', 'Stay tuned! Prizes will appear here as they are awarded.'),
('en', 'live_new_badge', 'NEW'),
-- Search Page
('en', 'search_header_title', 'Search Prizes'),
('en', 'search_header_subtitle', 'Search Prize Results'),
('en', 'search_card_title', 'Check Your Prize'),
('en', 'search_placeholder', 'Enter your number to search...'),
('en', 'search_button', 'Search'),
('en', 'search_tips_title', '💡 Search Tip'),
('en', 'search_tips_desc', 'Instant search as you type (minimum 4 characters)'),
('en', 'search_result_success_title', 'Congratulations! You won!'),
('en', 'search_result_notfound_title', 'No prize found'),
('en', 'search_warning_min_chars', 'Please enter at least 4 characters'),
('en', 'search_error_generic', 'Error occurred during search'),
('en', 'search_error_connection', 'Could not connect to server'),
-- Footer
('en', 'footer_copyright', 'Copyright © 2024 Faculty of Nursing Chiang Mai University. All rights reserved.'),
('en', 'footer_credit', 'Developed Communications and Branding Department')
ON DUPLICATE KEY UPDATE `lang_value` = `lang_value`; -- keep admin edits
