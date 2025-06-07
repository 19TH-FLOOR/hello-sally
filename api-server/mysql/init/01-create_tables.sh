#!/bin/bash
# MySQL 테이블 생성 스크립트
# 환경변수를 참조하여 동적으로 테이블을 생성

echo "Creating tables in database: ${MYSQL_DATABASE}"

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" <<-EOSQL
    -- audio_files 테이블 생성
    CREATE TABLE IF NOT EXISTS audio_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        s3_url VARCHAR(255) NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    -- 추후 필요한 테이블들은 여기에 추가
    
    SELECT 'Tables created successfully' AS status;
    SHOW TABLES;
EOSQL

echo "Table creation completed." 