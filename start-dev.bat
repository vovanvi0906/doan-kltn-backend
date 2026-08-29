@echo off
echo ==============================================
echo KHOI DONG HE THONG BACKEND (AUTO SEED + STUDIO)
echo ==============================================

echo 1. Kiem tra va bat Docker Database...
docker-compose up -d

echo 2. Cho Database on dinh (3 giay)...
timeout /t 3 /nobreak >nul

echo 3. Dong bo Schema...
call npx prisma migrate dev

echo 4. Kiem tra va Tao Super Admin...
call npx prisma db seed

echo 5. Mo Prisma Studio (Quan ly Database)...
start npx prisma studio

echo 6. Khoi dong NestJS Server...
call npm run start:dev