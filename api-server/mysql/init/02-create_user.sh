#!/bin/bash
# MySQL 사용자 권한 설정 스크립트
# 환경변수를 참조하여 동적으로 권한을 부여

echo "Setting up user permissions for database: ${MYSQL_DATABASE} and user: ${MYSQL_USER}"

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';
    FLUSH PRIVILEGES;
    SELECT 'User permissions granted successfully' AS status;
EOSQL

echo "User permissions setup completed." 