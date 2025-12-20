const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Tạo dữ liệu mẫu cho template
const sampleData = [
  {
    question_text: "An toàn lao động là gì?",
    question_type: "MULTIPLE_CHOICE",
    options: "A. Bảo vệ sức khỏe và tính mạng người lao động|B. Tiết kiệm chi phí sản xuất|C. Tăng năng suất lao động|D. Tất cả các đáp án trên",
    correct_answer: "A. Bảo vệ sức khỏe và tính mạng người lao động",
    explanation: "An toàn lao động là việc bảo vệ sức khỏe và tính mạng người lao động trong quá trình lao động.",
    difficulty_level: "EASY",
    points: 1
  },
  {
    question_text: "Khi nào cần sử dụng thiết bị bảo hộ cá nhân?",
    question_type: "MULTIPLE_CHOICE",
    options: "A. Chỉ khi có kiểm tra|B. Luôn luôn khi làm việc|C. Chỉ khi nguy hiểm|D. Không bao giờ",
    correct_answer: "B. Luôn luôn khi làm việc",
    explanation: "Thiết bị bảo hộ cá nhân cần được sử dụng luôn luôn khi làm việc để đảm bảo an toàn.",
    difficulty_level: "MEDIUM",
    points: 2
  },
  {
    question_text: "Các biện pháp phòng ngừa tai nạn lao động bao gồm?",
    question_type: "MULTIPLE_CHOICE",
    options: "A. Sử dụng thiết bị bảo hộ|B. Tuân thủ quy trình an toàn|C. Đào tạo nhân viên|D. Tất cả các đáp án trên",
    correct_answer: "D. Tất cả các đáp án trên",
    explanation: "Tất cả các biện pháp trên đều cần thiết để phòng ngừa tai nạn lao động.",
    difficulty_level: "MEDIUM",
    points: 2
  }
];

// Tạo workbook và worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Thiết lập độ rộng cột
const columnWidths = [
  { wch: 50 }, // question_text
  { wch: 20 }, // question_type
  { wch: 80 }, // options
  { wch: 50 }, // correct_answer
  { wch: 60 }, // explanation
  { wch: 15 }, // difficulty_level
  { wch: 10 }  // points
];
worksheet['!cols'] = columnWidths;

// Thêm worksheet vào workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

// Tạo sheet hướng dẫn
const instructionData = [
  { 
    field: "question_text", 
    description: "Nội dung câu hỏi", 
    required: "Bắt buộc",
    example: "An toàn lao động là gì?",
    note: "Câu hỏi phải rõ ràng, dễ hiểu"
  },
  { 
    field: "question_type", 
    description: "Loại câu hỏi", 
    required: "Bắt buộc",
    example: "MULTIPLE_CHOICE",
    note: "Chỉ hỗ trợ: MULTIPLE_CHOICE, TRUE_FALSE"
  },
  { 
    field: "options", 
    description: "Các lựa chọn (cách nhau bởi |)", 
    required: "Bắt buộc",
    example: "A. Đáp án 1|B. Đáp án 2|C. Đáp án 3|D. Đáp án 4",
    note: "Các lựa chọn cách nhau bởi dấu |"
  },
  { 
    field: "correct_answer", 
    description: "Đáp án đúng", 
    required: "Bắt buộc",
    example: "A. Đáp án 1",
    note: "Phải khớp với một trong các lựa chọn"
  },
  { 
    field: "explanation", 
    description: "Giải thích đáp án", 
    required: "Không bắt buộc",
    example: "Giải thích tại sao đáp án này đúng",
    note: "Có thể để trống"
  },
  { 
    field: "difficulty_level", 
    description: "Mức độ khó", 
    required: "Không bắt buộc",
    example: "EASY",
    note: "EASY, MEDIUM, HARD. Mặc định: MEDIUM"
  },
  { 
    field: "points", 
    description: "Điểm số", 
    required: "Không bắt buộc",
    example: "1",
    note: "Số nguyên từ 1-10. Mặc định: 1"
  }
];

const instructionSheet = XLSX.utils.json_to_sheet(instructionData);
instructionSheet['!cols'] = [
  { wch: 20 }, // field
  { wch: 30 }, // description
  { wch: 15 }, // required
  { wch: 50 }, // example
  { wch: 40 }  // note
];
XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Hướng dẫn');

// Tạo thư mục nếu chưa có
const templateDir = path.join(__dirname, '../uploads/templates');
if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
}

// Lưu file
const templatePath = path.join(templateDir, 'question_template.xlsx');
XLSX.writeFile(workbook, templatePath, { 
  bookType: 'xlsx',
  compression: true
});

console.log('✅ Template file created successfully!');
console.log(`📁 Location: ${templatePath}`);
console.log('\n📋 Template includes:');
console.log('  - Sheet "Questions": Sample questions with proper format');
console.log('  - Sheet "Hướng dẫn": Detailed instructions for each field');
console.log('\n💡 You can now use this file to import questions!');

