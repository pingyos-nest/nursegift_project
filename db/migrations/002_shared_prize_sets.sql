-- One prize set ("ชุดที่ N") holds both main and sub prizes.
-- Run after 001. Merges sub-prize sets into the shared `group` table and drops `group_sub`.

INSERT INTO `group` (datagroup)
SELECT gs.datagroup FROM group_sub gs
WHERE NOT EXISTS (SELECT 1 FROM `group` g WHERE g.datagroup = gs.datagroup);

-- Any sub prize pointing at a set that doesn't exist yet gets its set created too.
INSERT INTO `group` (datagroup)
SELECT DISTINCT s.datagroup FROM gif_sub s
WHERE NOT EXISTS (SELECT 1 FROM `group` g WHERE g.datagroup = s.datagroup);

DROP TABLE IF EXISTS group_sub;
