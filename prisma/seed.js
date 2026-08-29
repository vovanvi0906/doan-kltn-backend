const { PrismaClient, UserRole, UserStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Seed Data ---');

  // 1. Seed Super Admin User (Idempotent)
  const adminEmail = 'admin@homeservice.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  if (existingAdmin) {
    console.log(`Admin already exists: ${admin.email} (ID: ${admin.id})`);
  } else {
    console.log(`Admin created: ${admin.email} (ID: ${admin.id})`);
  }

  // 2. Seed 5 Service Categories
  const categoriesData = [
    {
      name: 'Vệ sinh',
      description: 'Dịch vụ dọn dẹp vệ sinh nhà cửa, máy lạnh, đệm và không gian sống',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/995/995053.png',
      isActive: true,
    },
    {
      name: 'Sửa điện',
      description: 'Khắc phục sự cố chập điện, lắp đặt và bảo dưỡng thiết bị điện dân dụng',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/2933/2933245.png',
      isActive: true,
    },
    {
      name: 'Sửa nước',
      description: 'Thông tắc đường ống, sửa chữa rò rỉ nước, thay van vòi và máy bơm',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3100/3100553.png',
      isActive: true,
    },
    {
      name: 'Thiết bị gia đình',
      description: 'Bảo trì, sửa chữa tủ lạnh, máy giặt, điều hòa, bình nóng lạnh',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
      isActive: true,
    },
    {
      name: 'Làm vườn',
      description: 'Cắt tỉa cây xanh cảnh quan, dọn dẹp cỏ và chăm sóc sân vườn định kỳ',
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1518/1518968.png',
      isActive: true,
    },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const existingCat = await prisma.serviceCategory.findFirst({
      where: { name: cat.name },
    });

    let savedCat;
    if (existingCat) {
      savedCat = await prisma.serviceCategory.update({
        where: { id: existingCat.id },
        data: cat,
      });
    } else {
      savedCat = await prisma.serviceCategory.create({
        data: cat,
      });
    }
    categoryMap[cat.name] = savedCat;
    console.log(`✓ Category seeded: ${savedCat.name} (ID: ${savedCat.id})`);
  }

  // 3. Seed Demo Services
  const servicesData = [
    {
      categoryName: 'Thiết bị gia đình',
      name: 'Vệ sinh máy lạnh',
      description: 'Vệ sinh lưới lọc, xịt rửa dàn nóng và dàn lạnh, kiểm tra gas máy lạnh',
      basePrice: 200000,
      unit: 'bộ',
      estimatedDurationMin: 60,
      isActive: true,
    },
    {
      categoryName: 'Sửa nước',
      name: 'Sửa ống nước rò rỉ',
      description: 'Dò tìm vị trí rò rỉ ngầm, hàn gắn hoặc thay thế ống nước PVC/PPR',
      basePrice: 150000,
      unit: 'điểm',
      estimatedDurationMin: 90,
      isActive: true,
    },
    {
      categoryName: 'Làm vườn',
      name: 'Cắt cỏ sân vườn',
      description: 'Dọn dẹp và cắt tỉa thảm cỏ sân vườn bằng máy, thu gom rác cây cỏ',
      basePrice: 180000,
      unit: 'buổi',
      estimatedDurationMin: 120,
      isActive: true,
    },
    {
      categoryName: 'Vệ sinh',
      name: 'Dọn dẹp nhà theo giờ',
      description: 'Lau sàn, quét dọn phòng khách, phòng ngủ và nhà bếp tổng thể',
      basePrice: 80000,
      unit: 'giờ',
      estimatedDurationMin: 180,
      isActive: true,
    },
    {
      categoryName: 'Sửa điện',
      name: 'Sửa chập điện âm tường',
      description: 'Đo kiểm phát hiện điểm ngắn mạch và xử lý an toàn hệ thống điện',
      basePrice: 250000,
      unit: 'lần',
      estimatedDurationMin: 90,
      isActive: true,
    },
  ];

  for (const svc of servicesData) {
    const category = categoryMap[svc.categoryName];
    if (!category) continue;

    const existingSvc = await prisma.service.findFirst({
      where: {
        name: svc.name,
        categoryId: category.id,
      },
    });

    const { categoryName, ...svcFields } = svc;
    let savedSvc;
    if (existingSvc) {
      savedSvc = await prisma.service.update({
        where: { id: existingSvc.id },
        data: {
          ...svcFields,
          categoryId: category.id,
        },
      });
    } else {
      savedSvc = await prisma.service.create({
        data: {
          ...svcFields,
          categoryId: category.id,
        },
      });
    }
    console.log(
      `✓ Service seeded: ${savedSvc.name} - Giá: ${savedSvc.basePrice}đ/${savedSvc.unit || 'lần'} (ID: ${savedSvc.id})`
    );
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
