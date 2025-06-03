-- 초기 테이블 생성 스크립트
USE hello_sally;

-- audio_files 테이블 생성
CREATE TABLE IF NOT EXISTS audio_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    s3_url VARCHAR(255) NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 추후 필요한 테이블들은 여기에 추가 