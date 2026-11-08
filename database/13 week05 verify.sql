-- Buoi 5: chi doc du lieu. Chay tung truy van trong Query Tool.

-- 1. So cho cua WEB-01 va RACE-01
SELECT class_id, capacity, enrolled, remaining
FROM v_section_summary
WHERE class_id IN ('WEB-01', 'RACE-01')
ORDER BY class_id;

-- 2. Cac lop sinh vien 22000004 dang dang ky
SELECT student_id, class_section_id
FROM enrollments
WHERE student_id = '22000004'
ORDER BY class_section_id;

-- 3. Nhat ky dang ky / huy cua 22000004 o WEB-01 (10 dong moi nhat)
SELECT id, student_id, class_section_id, event_type, occurred_at
FROM enrollment_events
WHERE dataset = 'demo'
  AND student_id = '22000004'
  AND class_section_id = 'WEB-01'
ORDER BY id DESC
LIMIT 10;