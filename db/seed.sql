-- Sample data for local development only. Usage: mysql -u <user> -p gift23 < db/seed.sql
INSERT INTO `group` (datagroup) VALUES (1), (2);
INSERT INTO gif_main (giftname, datagroup) VALUES ('ทีวี 55 นิ้ว', 1), ('ตู้เย็น', 1), ('ไมโครเวฟ', 1), ('จักรยาน', 2), ('หม้อหุงข้าว', 2);
INSERT INTO gif_sub (giftname, datagroup) VALUES ('แก้วน้ำ', 1), ('ร่ม', 1), ('พวงกุญแจ', 2);
INSERT INTO user (name, giftname, groupId, dateCreate) VALUES ('1001', 'ทีวี 55 นิ้ว', 1, NOW() - INTERVAL 5 MINUTE);
INSERT INTO user_sub (name, giftname, groupId, dateCreate) VALUES ('1002', 'แก้วน้ำ', 1, NOW() - INTERVAL 2 MINUTE);
