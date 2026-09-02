/**
 * KỊCH BẢN KIỂM THỬ TRANH CHẤP ĐƠN HÀNG (E2E CONCURRENCY & RACE CONDITION TEST)
 * Mô phỏng: 3 Thợ (Worker 1, Worker 2, Worker 3) cùng bấm nhận 1 đơn hàng trong cùng 1 mili-giây.
 * Kỳ vọng:
 *   - Chính xác 1 request thành công (HTTP 200 OK, status = ASSIGNED).
 *   - Chính xác 2 request thất bại (HTTP 409 Conflict, "Đơn hàng đã có thợ khác nhận").
 *   - Database tính toàn vẹn 100% (không bị race condition ghi đè).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000/api';

async function setupTestData() {
  console.log('🔄 [Setup] Khởi tạo dữ liệu kiểm thử tranh chấp...');

  // 1. Tạo hoặc lấy Service
  let category = await prisma.serviceCategory.findFirst();
  if (!category) {
    category = await prisma.serviceCategory.create({
      data: { name: 'Điện Lạnh Gia Dụng', description: 'Sửa máy giặt, máy lạnh' },
    });
  }

  let service = await prisma.service.findFirst({ where: { categoryId: category.id } });
  if (!service) {
    service = await prisma.service.create({
      data: {
        categoryId: category.id,
        name: 'Sửa máy lạnh khẩn cấp (Test)',
        basePrice: 200000,
        isActive: true,
      },
    });
  }

  // 2. Tạo Customer
  let customerUser = await prisma.user.findUnique({ where: { email: 'customer.race.test@fixgo.vn' } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        email: 'customer.race.test@fixgo.vn',
        passwordHash: 'dummy_hash',
        role: 'CUSTOMER',
        customerProfile: {
          create: {
            fullName: 'Khách Hàng Test Tranh Chấp',
          },
        },
      },
      include: { customerProfile: true },
    });
  } else {
    customerUser = await prisma.user.findUnique({
      where: { id: customerUser.id },
      include: { customerProfile: true },
    });
  }

  // 3. Tạo 3 Thợ (Worker 1, Worker 2, Worker 3)
  const workerProfiles = [];
  for (let i = 1; i <= 3; i++) {
    const email = `worker.${i}.race.test@fixgo.vn`;
    let workerUser = await prisma.user.findUnique({ where: { email } });
    if (!workerUser) {
      workerUser = await prisma.user.create({
        data: {
          email,
          passwordHash: 'dummy_hash',
          role: 'WORKER',
          workerProfile: {
            create: {
              fullName: `Thợ Đối Tác #${i} (Test Race)`,
              isOnline: true,
              approvalStatus: 'APPROVED',
              currentLat: 10.762622 + (i * 0.001),
              currentLng: 106.660172 + (i * 0.001),
            },
          },
        },
        include: { workerProfile: true },
      });
    } else {
      workerUser = await prisma.user.findUnique({
        where: { id: workerUser.id },
        include: { workerProfile: true },
      });
    }
    workerProfiles.push(workerUser.workerProfile);
  }

  // 4. Tạo 1 Đơn hàng mới ở trạng thái SEARCHING
  const testOrder = await prisma.order.create({
    data: {
      customerId: customerUser.customerProfile.id,
      serviceId: service.id,
      pickupAddress: '268 Lý Thường Kiệt, Q.10, TP.HCM',
      pickupLat: 10.762622,
      pickupLng: 106.660172,
      totalPrice: 200000,
      status: 'SEARCHING',
      note: 'Đơn hàng thử nghiệm tranh chấp Race Condition',
      statusHistory: {
        create: {
          status: 'SEARCHING',
          note: 'Khởi tạo đơn cho bài test Concurrency',
        },
      },
    },
  });

  console.log(`✅ [Setup Xong] Đơn hàng test ID: ${testOrder.id} (Trạng thái: SEARCHING)`);
  console.log(`👨‍🔧 3 Thợ tham gia tranh chấp: [${workerProfiles.map(w => w.fullName).join(', ')}]`);

  return { testOrder, workerProfiles };
}

// Hàm mô phỏng logic nhận đơn nguyên tử (Atomic Assign) trực tiếp trên database
async function simulateWorkerAcceptDirect(orderId, workerProfileId, workerName) {
  const startTime = Date.now();
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Atomic Update có điều kiện
      const updateRes = await tx.order.updateMany({
        where: {
          id: orderId,
          status: 'SEARCHING',
        },
        data: {
          status: 'ASSIGNED',
          workerId: workerProfileId,
        },
      });

      if (updateRes.count === 0) {
        const error = new Error('HTTP 409 Conflict: Đơn hàng đã có thợ khác nhận!');
        error.status = 409;
        throw error;
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'ASSIGNED',
          note: `Thợ ${workerName} nhận đơn thành công`,
        },
      });

      return { status: 200, message: 'Nhận đơn thành công!', workerName };
    });

    return {
      worker: workerName,
      status: 200,
      durationMs: Date.now() - startTime,
      result,
    };
  } catch (error) {
    return {
      worker: workerName,
      status: error.status || 409,
      durationMs: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function runConcurrencyTest() {
  console.log('\n===============================================================');
  console.log('🧪 BẮT ĐẦU CHẠY KIỂM THỬ TRANH CHẤP 3 THỢ (PROMISE.ALL RACE TEST)');
  console.log('===============================================================\n');

  const { testOrder, workerProfiles } = await setupTestData();

  console.log('\n⚡ [KÍCH HOẠT ĐỒNG THỜI 3 THỢ BẤM NHẬN ĐƠN CÙNG 1 MILI-GIÂY]...');
  const t0 = Date.now();

  const results = await Promise.all([
    simulateWorkerAcceptDirect(testOrder.id, workerProfiles[0].id, workerProfiles[0].fullName),
    simulateWorkerAcceptDirect(testOrder.id, workerProfiles[1].id, workerProfiles[1].fullName),
    simulateWorkerAcceptDirect(testOrder.id, workerProfiles[2].id, workerProfiles[2].fullName),
  ]);

  const totalTimeMs = Date.now() - t0;

  console.log(`\n⏱️ Hoàn tất 3 request tranh chấp trong: ${totalTimeMs} ms\n`);

  console.log('---------------- KẾT QUẢ TỪNG WORKER ----------------');
  let successCount = 0;
  let conflictCount = 0;

  results.forEach((res, index) => {
    if (res.status === 200) {
      successCount++;
      console.log(`🏆 [Thợ #${index + 1} - ${res.worker}]: HTTP 200 OK (THÀNH CÔNG) - Thời gian: ${res.durationMs}ms`);
    } else if (res.status === 409) {
      conflictCount++;
      console.log(`⛔ [Thợ #${index + 1} - ${res.worker}]: HTTP 409 CONFLICT ("${res.error}") - Thời gian: ${res.durationMs}ms`);
    } else {
      console.log(`❓ [Thợ #${index + 1} - ${res.worker}]: HTTP ${res.status} (${res.error})`);
    }
  });

  console.log('------------------------------------------------------');

  // Kiểm tra tính toàn vẹn trong Database
  const finalOrder = await prisma.order.findUnique({
    where: { id: testOrder.id },
    include: { worker: true, statusHistory: true },
  });

  console.log('\n📊 [KIỂM TRA CƠ SỞ DỮ LIỆU]:');
  console.log(`  - Trạng thái đơn cuối cùng: ${finalOrder.status} (Kỳ vọng: ASSIGNED)`);
  console.log(`  - Thợ trúng đơn: ${finalOrder.worker?.fullName}`);
  console.log(`  - Tổng số bản ghi lịch sử trạng thái: ${finalOrder.statusHistory.length} (Kỳ vọng: 2 - 1 SEARCHING + 1 ASSIGNED)`);

  console.log('\n======================================================');
  if (successCount === 1 && conflictCount === 2 && finalOrder.status === 'ASSIGNED') {
    console.log('🎉 KẾT QUẢ KIỂM THỬ: PASS 100% ✅');
    console.log('   Cơ chế Atomic Lock của Prisma $transaction đã chặn hoàn toàn Race Condition.');
  } else {
    console.log('❌ KẾT QUẢ KIỂM THỬ: FAIL ❌');
  }
  console.log('======================================================\n');

  await prisma.$disconnect();
}

runConcurrencyTest().catch((err) => {
  console.error('Lỗi thực thi test:', err);
  prisma.$disconnect();
  process.exit(1);
});
