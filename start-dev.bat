@echo off
echo ==============================================
echo KHOI DONG HE THONG BACKEND
echo ==============================================

echo 1. Kiem tra va bat Docker Database...
docker-compose up -d

echo 2. Cho Database on dinh (3 giay)...
timeout /t 3 /nobreak >nul

echo 3. Khoi dong NestJS Server...
npm run start:dev