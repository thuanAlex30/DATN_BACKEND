const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Role names from backend (must match exactly with role_name in database)
const ROLES = {
  DEPARTMENT_HEADER: 'Department Header',
  MANAGER: 'Department Manager',
  EMPLOYEE: 'Employee'
};


// Generate Vietnamese names
const FIRST_NAMES = [
  'Nguyễn Văn', 'Trần Thị', 'Lê Văn', 'Phạm Thị', 'Hoàng Văn',
  'Vũ Thị', 'Đặng Văn', 'Bùi Thị', 'Đỗ Văn', 'Hồ Thị',
  'Ngô Văn', 'Dương Thị', 'Lý Văn', 'Võ Thị', 'Phan Văn',
  'Trương Thị', 'Lương Văn', 'Đinh Thị', 'Đào Văn', 'Tạ Thị'
];

const MIDDLE_NAMES = [
  'Thị', 'Văn', 'Đức', 'Minh', 'Hữu', 'Quang', 'Thanh', 'Anh', 'Tuấn', 'Hải'
];

const LAST_NAMES = [
  'An', 'Bình', 'Cường', 'Dũng', 'Đức', 'Giang', 'Hải', 'Hoàng', 'Hùng', 'Khang',
  'Linh', 'Minh', 'Nam', 'Phong', 'Quang', 'Sơn', 'Tài', 'Tuấn', 'Việt', 'Yên'
];

function generateVietnameseName(index) {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const middleName = MIDDLE_NAMES[Math.floor(index / FIRST_NAMES.length) % MIDDLE_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(index / LAST_NAMES.length) % LAST_NAMES.length];
  return `${firstName} ${middleName} ${lastName}`;
}

function generateEmail(username) {
  return `${username}@company.com`;
}

function generatePhone(index) {
  const base = 900000000 + index;
  return `0${base}`;
}

function generateBirthDate(index) {
  // Generate birth dates between 1980 and 2000
  const year = 1980 + (index % 21);
  const month = String(1 + (index % 12)).padStart(2, '0');
  const day = String(1 + (index % 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateAddress(index) {
  const streets = ['Đường ABC', 'Đường XYZ', 'Đường DEF', 'Đường GHI', 'Đường JKL'];
  const cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
  const street = streets[index % streets.length];
  const city = cities[Math.floor(index / streets.length) % cities.length];
  const number = 100 + (index % 900);
  return `${number} ${street}, ${city}`;
}

async function generateUsersExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');

  // Define columns
  worksheet.columns = [
    { header: 'username', key: 'username', width: 15 },
    { header: 'email', key: 'email', width: 25 },
    { header: 'password', key: 'password', width: 15 },
    { header: 'full_name', key: 'full_name', width: 25 },
    { header: 'phone', key: 'phone', width: 15 },
    { header: 'birth_date', key: 'birth_date', width: 15 },
    { header: 'address', key: 'address', width: 40 },
    { header: 'role_name', key: 'role_name', width: 20 },
    { header: 'is_active', key: 'is_active', width: 10 }
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const users = [];
  let userIndex = 0;

  // 3 Department Header users
  for (let i = 0; i < 3; i++) {
    const username = `header${String(i + 1).padStart(2, '0')}`;
    const fullName = generateVietnameseName(userIndex);
    users.push({
      username,
      email: generateEmail(username),
      password: 'Password123',
      full_name: fullName,
      phone: generatePhone(userIndex),
      birth_date: generateBirthDate(userIndex),
      address: generateAddress(userIndex),
      role_name: ROLES.DEPARTMENT_HEADER,
      is_active: true
    });
    userIndex++;
  }

  // 5 Manager users
  for (let i = 0; i < 5; i++) {
    const username = `manager${String(i + 1).padStart(2, '0')}`;
    const fullName = generateVietnameseName(userIndex);
    users.push({
      username,
      email: generateEmail(username),
      password: 'Password123',
      full_name: fullName,
      phone: generatePhone(userIndex),
      birth_date: generateBirthDate(userIndex),
      address: generateAddress(userIndex),
      role_name: ROLES.MANAGER,
      is_active: true
    });
    userIndex++;
  }

  // 92 Employee users (100 - 3 - 5 = 92)
  for (let i = 0; i < 92; i++) {
    const username = `emp${String(i + 1).padStart(2, '0')}`;
    const fullName = generateVietnameseName(userIndex);
    users.push({
      username,
      email: generateEmail(username),
      password: 'Password123',
      full_name: fullName,
      phone: generatePhone(userIndex),
      birth_date: generateBirthDate(userIndex),
      address: generateAddress(userIndex),
      role_name: ROLES.EMPLOYEE,
      is_active: true
    });
    userIndex++;
  }

  // Add users to worksheet
  users.forEach(user => {
    worksheet.addRow(user);
  });

  // Save file
  const outputPath = path.join(__dirname, '../users_100_sample.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  
  console.log(`✅ File Excel đã được tạo thành công: ${outputPath}`);
  console.log(`📊 Tổng số users: ${users.length}`);
  console.log(`   - Department Header: 3`);
  console.log(`   - Department Manager: 5`);
  console.log(`   - Employee: 92`);
  console.log(`\n📝 Role names được sử dụng:`);
  console.log(`   - "${ROLES.DEPARTMENT_HEADER}"`);
  console.log(`   - "${ROLES.MANAGER}"`);
  console.log(`   - "${ROLES.EMPLOYEE}"`);
  console.log(`\n⚠️  Lưu ý: Đảm bảo các role_name này đã tồn tại trong database!`);
}

// Run the script
generateUsersExcel().catch(console.error);

