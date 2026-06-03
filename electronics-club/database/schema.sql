-- ============================================================
-- Electronics Club Management System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS electronics_club
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE electronics_club;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'committee', 'member') DEFAULT 'member',
  classroom VARCHAR(50),
  phone VARCHAR(20),
  avatar VARCHAR(255),
  line_user_id VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- NEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  excerpt VARCHAR(500),
  image_url VARCHAR(255),
  category ENUM('announcement','activity','achievement','general') DEFAULT 'general',
  is_published BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME NOT NULL,
  type ENUM('club','college','competition','meeting','other') DEFAULT 'club',
  color VARCHAR(20) DEFAULT '#0288D1',
  is_all_day BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  category ENUM('report','manual','form','meeting_minutes','research','other') DEFAULT 'other',
  download_count INT DEFAULT 0,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA - Admin user
-- password: admin1234 (bcrypt hash)
-- ============================================================
INSERT INTO users (student_id, full_name, email, password, role, classroom)
VALUES (
  '6501001',
  'ผู้ดูแลระบบ',
  'admin@electronics-club.ac.th',
  '$2a$10$2Jh3/8fcXCffDPWM9qw.kOKbsfZIzuLH.iS8HbuS/eCtAenijEZPe',
  'admin',
  'ทีมบริหาร'
);

-- Seed news
INSERT INTO news (title, content, excerpt, category, is_published, author_id)
VALUES (
  'ยินดีต้อนรับสู่ระบบบริหารจัดการชมรมวิชาชีพอิเล็กทรอนิกส์',
  '<p>ขอต้อนรับสมาชิกใหม่ทุกท่านสู่ระบบออนไลน์ของชมรมวิชาชีพอิเล็กทรอนิกส์ ระบบนี้จะช่วยให้การบริหารจัดการชมรมเป็นไปอย่างมีระเบียบและมีประสิทธิภาพมากขึ้น</p><p>สมาชิกสามารถติดตามข่าวสาร กิจกรรม และดาวน์โหลดเอกสารต่างๆ ได้ผ่านระบบนี้</p>',
  'ขอต้อนรับสมาชิกใหม่ทุกท่านสู่ระบบออนไลน์ของชมรมวิชาชีพอิเล็กทรอนิกส์',
  'announcement',
  TRUE,
  1
),
(
  'การแข่งขันทักษะวิชาชีพอิเล็กทรอนิกส์ประจำปี 2568',
  '<p>ชมรมวิชาชีพอิเล็กทรอนิกส์ขอประชาสัมพันธ์การแข่งขันทักษะวิชาชีพประจำปีการศึกษา 2568 ซึ่งจะจัดขึ้นในเดือนกรกฎาคมนี้</p><p>สมาชิกที่สนใจเข้าร่วมการแข่งขัน สามารถสมัครได้ที่ระบบหรือติดต่อคณะกรรมการชมรม</p>',
  'ชมรมขอประชาสัมพันธ์การแข่งขันทักษะวิชาชีพประจำปี 2568',
  'activity',
  TRUE,
  1
),
(
  'ชมรมได้รับรางวัลชมรมดีเด่นประจำปี 2567',
  '<p>ขอแสดงความยินดีกับชมรมวิชาชีพอิเล็กทรอนิกส์ที่ได้รับรางวัลชมรมดีเด่นประจำปีการศึกษา 2567 จากทางวิทยาลัย</p><p>ความสำเร็จนี้เกิดจากความร่วมมือของสมาชิกทุกคน ขอบคุณทุกท่านที่ทุ่มเทและร่วมแรงร่วมใจกัน</p>',
  'ชมรมได้รับรางวัลชมรมดีเด่นประจำปีการศึกษา 2567',
  'achievement',
  TRUE,
  1
);

-- Seed events
INSERT INTO events (title, description, location, start_datetime, end_datetime, type, color, created_by)
VALUES 
(
  'ประชุมคณะกรรมการชมรมครั้งที่ 1',
  'ประชุมคณะกรรมการชมรมประจำเดือน เพื่อติดตามความคืบหน้าและวางแผนกิจกรรม',
  'ห้องประชุมชมรม',
  '2026-06-05 14:00:00',
  '2026-06-05 16:00:00',
  'meeting',
  '#0288D1',
  1
),
(
  'อบรมทักษะการบัดกรีวงจรอิเล็กทรอนิกส์',
  'กิจกรรมอบรมทักษะการบัดกรีวงจรอิเล็กทรอนิกส์สำหรับสมาชิกใหม่',
  'ห้องปฏิบัติการอิเล็กทรอนิกส์',
  '2026-06-12 09:00:00',
  '2026-06-12 16:00:00',
  'club',
  '#1565C0',
  1
),
(
  'วันไหว้ครู ประจำปีการศึกษา 2568',
  'พิธีไหว้ครูประจำปีการศึกษา 2568',
  'หอประชุมใหญ่',
  '2026-06-18 08:00:00',
  '2026-06-18 12:00:00',
  'college',
  '#FF6F00',
  1
),
(
  'การแข่งขันทักษะวิชาชีพระดับภาค',
  'เข้าร่วมการแข่งขันทักษะวิชาชีพอิเล็กทรอนิกส์ระดับภาค',
  'วิทยาลัยเทคนิคเชียงใหม่',
  '2026-07-08 07:00:00',
  '2026-07-09 17:00:00',
  'competition',
  '#FFD600',
  1
);
