-- ============================================================
-- Electronics Club Management System
-- SQL Server Schema (converted from MySQL)
-- Compatible with: SQL Server 2019+ / SQL Server Express
-- Run this in SSMS against the electronics_club database
-- ============================================================

USE electronics_club;
GO

-- ============================================================
-- USERS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  student_id  NVARCHAR(20)  UNIQUE NOT NULL,
  full_name   NVARCHAR(100) NOT NULL,
  email       NVARCHAR(150) UNIQUE NOT NULL,
  password    NVARCHAR(255) NOT NULL,
  role        NVARCHAR(20)  NOT NULL DEFAULT 'member'
                CHECK (role IN ('admin','committee','member')),
  classroom   NVARCHAR(50),
  phone       NVARCHAR(20),
  avatar      NVARCHAR(255),
  line_user_id NVARCHAR(100),
  is_active   BIT           NOT NULL DEFAULT 1,
  created_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at  DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

-- Auto-update updated_at on users
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_users_updated_at')
EXEC('
CREATE TRIGGER trg_users_updated_at
ON users AFTER UPDATE AS
  UPDATE users SET updated_at = GETDATE()
  WHERE id IN (SELECT id FROM inserted)
');
GO

-- ============================================================
-- NEWS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'news')
CREATE TABLE news (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  title        NVARCHAR(255) NOT NULL,
  content      NVARCHAR(MAX) NOT NULL,
  excerpt      NVARCHAR(500),
  image_url    NVARCHAR(255),
  category     NVARCHAR(30)  NOT NULL DEFAULT 'general'
                 CHECK (category IN ('announcement','activity','achievement','general')),
  is_published BIT           NOT NULL DEFAULT 0,
  view_count   INT           NOT NULL DEFAULT 0,
  author_id    INT           NOT NULL,
  created_at   DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at   DATETIME2     NOT NULL DEFAULT GETDATE(),
  CONSTRAINT fk_news_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_news_updated_at')
EXEC('
CREATE TRIGGER trg_news_updated_at
ON news AFTER UPDATE AS
  UPDATE news SET updated_at = GETDATE()
  WHERE id IN (SELECT id FROM inserted)
');
GO

-- ============================================================
-- EVENTS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'events')
CREATE TABLE events (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  title          NVARCHAR(255) NOT NULL,
  description    NVARCHAR(MAX),
  location       NVARCHAR(255),
  start_datetime DATETIME2     NOT NULL,
  end_datetime   DATETIME2     NOT NULL,
  type           NVARCHAR(30)  NOT NULL DEFAULT 'club'
                   CHECK (type IN ('club','college','competition','meeting','other')),
  color          NVARCHAR(20)  NOT NULL DEFAULT '#0288D1',
  is_all_day     BIT           NOT NULL DEFAULT 0,
  created_by     INT           NOT NULL,
  created_at     DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at     DATETIME2     NOT NULL DEFAULT GETDATE(),
  CONSTRAINT fk_events_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
GO

IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_events_updated_at')
EXEC('
CREATE TRIGGER trg_events_updated_at
ON events AFTER UPDATE AS
  UPDATE events SET updated_at = GETDATE()
  WHERE id IN (SELECT id FROM inserted)
');
GO

-- ============================================================
-- DOCUMENTS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'documents')
CREATE TABLE documents (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  title          NVARCHAR(255) NOT NULL,
  description    NVARCHAR(MAX),
  filename       NVARCHAR(255) NOT NULL,
  original_name  NVARCHAR(255) NOT NULL,
  file_type      NVARCHAR(50)  NOT NULL,
  file_size      BIGINT        NOT NULL,
  category       NVARCHAR(50)  NOT NULL DEFAULT 'other'
                   CHECK (category IN ('report','manual','form','meeting_minutes','research','other')),
  download_count INT           NOT NULL DEFAULT 0,
  uploaded_by    INT           NOT NULL,
  created_at     DATETIME2     NOT NULL DEFAULT GETDATE(),
  CONSTRAINT fk_documents_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
CREATE TABLE notifications (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  user_id    INT,
  title      NVARCHAR(255) NOT NULL,
  message    NVARCHAR(MAX) NOT NULL,
  type       NVARCHAR(20)  NOT NULL DEFAULT 'info'
               CHECK (type IN ('info','success','warning','error')),
  is_read    BIT           NOT NULL DEFAULT 0,
  link       NVARCHAR(255),
  created_at DATETIME2     NOT NULL DEFAULT GETDATE(),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- ============================================================
-- SEED DATA — Admin user
-- password: admin1234  (bcrypt hash)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE student_id = '6501001')
INSERT INTO users (student_id, full_name, email, password, role, classroom)
VALUES (
  '6501001',
  N'ผู้ดูแลระบบ',
  'admin@electronics-club.ac.th',
  '$2a$10$2Jh3/8fcXCffDPWM9qw.kOKbsfZIzuLH.iS8HbuS/eCtAenijEZPe',
  'admin',
  N'ทีมบริหาร'
);
GO

-- Seed news (only if empty)
IF NOT EXISTS (SELECT 1 FROM news)
BEGIN
  INSERT INTO news (title, content, excerpt, category, is_published, author_id) VALUES
  (
    N'ยินดีต้อนรับสู่ระบบบริหารจัดการชมรมวิชาชีพอิเล็กทรอนิกส์',
    N'<p>ขอต้อนรับสมาชิกใหม่ทุกท่านสู่ระบบออนไลน์ของชมรมวิชาชีพอิเล็กทรอนิกส์ ระบบนี้จะช่วยให้การบริหารจัดการชมรมเป็นไปอย่างมีระเบียบและมีประสิทธิภาพมากขึ้น</p>',
    N'ขอต้อนรับสมาชิกใหม่ทุกท่านสู่ระบบออนไลน์ของชมรมวิชาชีพอิเล็กทรอนิกส์',
    'announcement', 1, 1
  ),
  (
    N'การแข่งขันทักษะวิชาชีพอิเล็กทรอนิกส์ประจำปี 2568',
    N'<p>ชมรมขอประชาสัมพันธ์การแข่งขันทักษะวิชาชีพประจำปีการศึกษา 2568 ซึ่งจะจัดขึ้นในเดือนกรกฎาคมนี้</p>',
    N'ชมรมขอประชาสัมพันธ์การแข่งขันทักษะวิชาชีพประจำปี 2568',
    'activity', 1, 1
  ),
  (
    N'ชมรมได้รับรางวัลชมรมดีเด่นประจำปี 2567',
    N'<p>ขอแสดงความยินดีกับชมรมที่ได้รับรางวัลชมรมดีเด่นประจำปีการศึกษา 2567</p>',
    N'ชมรมได้รับรางวัลชมรมดีเด่นประจำปีการศึกษา 2567',
    'achievement', 1, 1
  );
END
GO

-- Seed events (only if empty)
IF NOT EXISTS (SELECT 1 FROM events)
BEGIN
  INSERT INTO events (title, description, location, start_datetime, end_datetime, type, color, created_by) VALUES
  (
    N'ประชุมคณะกรรมการชมรมครั้งที่ 1',
    N'ประชุมคณะกรรมการชมรมประจำเดือน',
    N'ห้องประชุมชมรม',
    '2026-06-05 14:00:00', '2026-06-05 16:00:00', 'meeting', '#0288D1', 1
  ),
  (
    N'อบรมทักษะการบัดกรีวงจรอิเล็กทรอนิกส์',
    N'กิจกรรมอบรมทักษะสำหรับสมาชิกใหม่',
    N'ห้องปฏิบัติการอิเล็กทรอนิกส์',
    '2026-06-12 09:00:00', '2026-06-12 16:00:00', 'club', '#1565C0', 1
  ),
  (
    N'วันไหว้ครู ประจำปีการศึกษา 2568',
    N'พิธีไหว้ครูประจำปีการศึกษา 2568',
    N'หอประชุมใหญ่',
    '2026-06-18 08:00:00', '2026-06-18 12:00:00', 'college', '#FF6F00', 1
  ),
  (
    N'การแข่งขันทักษะวิชาชีพระดับภาค',
    N'เข้าร่วมการแข่งขันทักษะวิชาชีพอิเล็กทรอนิกส์ระดับภาค',
    N'วิทยาลัยเทคนิคเชียงใหม่',
    '2026-07-08 07:00:00', '2026-07-09 17:00:00', 'competition', '#FFD600', 1
  );
END
GO

PRINT 'Schema created successfully!';
GO
