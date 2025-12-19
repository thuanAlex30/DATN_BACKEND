const XLSX = require('xlsx');
const path = require('path');

// Create headers for Excel template
const headers = [
    'content', 'option_a', 'option_b', 'option_c', 'option_d', 
    'correct_answer', 'explanation', 'difficulty_level', 'points'
];

// Create sample data for Excel template
const sampleData = [
    headers,
    [
        'Câu hỏi mẫu 1: An toàn lao động là gì?',
        'Là việc đảm bảo an toàn cho người lao động trong quá trình làm việc',
        'Là việc đảm bảo chất lượng sản phẩm',
        'Là việc tăng năng suất lao động',
        'Là việc giảm chi phí sản xuất',
        'Là việc đảm bảo an toàn cho người lao động trong quá trình làm việc',
        'An toàn lao động là tập hợp các biện pháp, quy định nhằm đảm bảo an toàn cho người lao động.',
        'EASY',
        1
    ],
    [
        'Câu hỏi mẫu 2: Khi phát hiện nguy hiểm tại nơi làm việc, bạn cần làm gì?',
        'Báo cáo ngay cho người phụ trách',
        'Tiếp tục làm việc bình thường',
        'Tự xử lý mà không báo cáo',
        'Bỏ qua vì không liên quan đến mình',
        'Báo cáo ngay cho người phụ trách',
        'Khi phát hiện nguy hiểm, cần báo cáo ngay để có biện pháp xử lý kịp thời.',
        'MEDIUM',
        2
    ],
    [
        'Câu hỏi mẫu 3: PPE là việc viết tắt của gì?',
        'Personal Protective Equipment',
        'Professional Performance Evaluation',
        'Project Planning and Execution',
        'Personal Productivity Enhancement',
        'Personal Protective Equipment',
        'PPE là thiết bị bảo hộ cá nhân được sử dụng để bảo vệ người lao động.',
        'HARD',
        3
    ]
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');

// Function to create template
const createTemplate = () => {
    // Generate buffer directly
    const buffer = XLSX.write(workbook, { 
        bookType: 'xlsx',
        type: 'buffer'
    });
    
    console.log('Excel template buffer created, size:', buffer.length, 'bytes');
    
    return buffer;
};

module.exports = { createTemplate };
