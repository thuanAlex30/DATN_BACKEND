# 📊 SƠ ĐỒ LUỒNG ĐÀO TẠO (TRAINING FLOW DIAGRAM)

## 🔄 LUỒNG TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRAINING SYSTEM FLOW                         │
└─────────────────────────────────────────────────────────────────┘

ADMIN SIDE                          EMPLOYEE SIDE
─────────────────                  ─────────────────

1. Tạo Course Set                   
   │                               
   ├─> 2. Tạo Course                
   │                               
   ├─> 3. Tạo Question Bank         
   │                               
   ├─> 4. Tạo Questions             
   │                               
   └─> 5. Tạo Training Session ────┐
                                   │
                                   ▼
                            ┌──────────────┐
                            │  Xem Courses │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │   Đăng ký    │
                            │  (Enroll)    │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │ Chờ Session  │
                            │   Bắt đầu    │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │ Start Training│
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │  Làm Bài     │
                            │  (Questions) │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │ Submit Bài   │
                            └──────┬───────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
            ┌──────────────┐            ┌──────────────┐
            │    PASS      │            │    FAIL      │
            │  (≥ 70%)     │            │   (< 70%)    │
            └──────┬───────┘            └──────┬───────┘
                   │                           │
                   ▼                           ▼
            ┌──────────────┐            ┌──────────────┐
            │ Certificate  │            │   Retake?    │
            │  Generated   │            └──────┬───────┘
            └──────────────┘                   │
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  Yes → Start │
                                        │  No → End   │
                                        └──────────────┘
```

## 📈 STATE DIAGRAM - SESSION STATUS

```
                    ┌─────────────┐
                    │  SCHEDULED  │
                    │  (Đã lên    │
                    │   lịch)     │
                    └──────┬──────┘
                           │
                           │ (start_time <= now <= end_time)
                           ▼
                    ┌─────────────┐
                    │   ONGOING   │
                    │  (Đang diễn │
                    │    ra)      │
                    └──────┬──────┘
                           │
                           │ (now > end_time)
                           ▼
                    ┌─────────────┐
                    │  COMPLETED  │
                    │ (Hoàn thành)│
                    └─────────────┘
                           │
                           │ (Admin hủy)
                           ▼
                    ┌─────────────┐
                    │  CANCELLED  │
                    │  (Đã hủy)   │
                    └─────────────┘
```

## 📈 STATE DIAGRAM - ENROLLMENT STATUS

```
                    ┌─────────────┐
                    │   enrolled  │
                    │ (Đã đăng ký)│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │ (Submit & Pass)  │ (Submit & Fail)  │ (Admin hủy)
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  completed  │    │   failed    │    │  cancelled  │
│  (Hoàn thành│    │  (Không đạt)│    │   (Đã hủy)  │
│   & đậu)    │    └──────┬──────┘    └─────────────┘
└─────────────┘           │
                          │ (Retake)
                          ▼
                    ┌─────────────┐
                    │   enrolled  │
                    │  (Làm lại)  │
                    └─────────────┘
```

## 🔄 ENROLLMENT FLOW DETAIL

```
┌─────────────────────────────────────────────────────────────┐
│                    ENROLLMENT PROCESS                        │
└─────────────────────────────────────────────────────────────┘

Employee clicks "Đăng ký"
         │
         ▼
┌────────────────────┐
│ Validate Prerequisites │
│ (Nếu có)            │
└──────┬──────────────┘
       │
       ├─> Chưa hoàn thành prerequisites
       │   └─> Show error + List prerequisites
       │
       └─> Đã hoàn thành
           │
           ▼
┌────────────────────┐
│ Find Available     │
│ Sessions           │
└──────┬──────────────┘
       │
       ├─> Không có session
       │   └─> Show: "Không có session khả dụng"
       │
       └─> Có session
           │
           ▼
┌────────────────────┐
│ Check Session      │
│ Capacity           │
└──────┬──────────────┘
       │
       ├─> Đầy chỗ
       │   └─> Show: "Session đã đầy" + Suggest other sessions
       │
       └─> Còn chỗ
           │
           ▼
┌────────────────────┐
│ Check User Already │
│ Enrolled           │
└──────┬──────────────┘
       │
       ├─> Đã enroll
       │   └─> Show: "Bạn đã đăng ký session này"
       │
       └─> Chưa enroll
           │
           ▼
┌────────────────────┐
│ Create Enrollment  │
│ - session_id       │
│ - user_id          │
│ - status: enrolled │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Send Notification  │
│ - WebSocket        │
│ - Email (optional) │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Success Message    │
│ "Đăng ký thành công"│
└────────────────────┘
```

## 🎯 TRAINING EXECUTION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│              TRAINING EXECUTION PROCESS                      │
└─────────────────────────────────────────────────────────────┘

Employee clicks "Bắt đầu làm bài"
         │
         ▼
┌────────────────────┐
│ Validate Session   │
│ - Status = ONGOING │
│ - User enrolled    │
│ - Not expired      │
└──────┬──────────────┘
       │
       ├─> Invalid
       │   └─> Show error + Redirect
       │
       └─> Valid
           │
           ▼
┌────────────────────┐
│ Get Questions      │
│ - From Question Bank│
│ - Shuffle (optional)│
│ - Limit count      │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Create Progress    │
│ Record             │
│ - Start time       │
│ - Questions        │
│ - Time limit       │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Display Questions  │
│ - Timer            │
│ - Progress bar     │
│ - Navigation       │
└──────┬──────────────┘
       │
       │ (User answers questions)
       │
       ▼
┌────────────────────┐
│ User clicks Submit │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Validate Submit    │
│ - Not submitted    │
│ - Within time      │
│ - At least 1 answer│
└──────┬──────────────┘
       │
       ├─> Invalid
       │   └─> Show error
       │
       └─> Valid
           │
           ▼
┌────────────────────┐
│ Calculate Score    │
│ - Compare answers  │
│ - Sum points       │
│ - Calculate %      │
│ - Check pass (70%) │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Update Enrollment  │
│ - status           │
│ - score            │
│ - passed           │
│ - completion_date   │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Create History     │
│ Record             │
│ - answers detail   │
│ - score breakdown  │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Send Events        │
│ - Completion event  │
│ - Notification     │
└──────┬──────────────┘
       │
       ▼
┌────────────────────┐
│ Show Results       │
│ - Pass/Fail        │
│ - Score            │
│ - Certificate (if pass)│
│ - Retake (if fail) │
└────────────────────┘
```

## 🔔 NOTIFICATION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                  NOTIFICATION TIMELINE                      │
└─────────────────────────────────────────────────────────────┘

T-7 days: "Bạn có session sắp tới"
    │
    ▼
T-1 day: "Session của bạn vào ngày mai"
    │
    ▼
T-1 hour: "Session bắt đầu sau 1 giờ"
    │
    ▼
T-0 (Start): "Session đã bắt đầu, hãy bắt đầu làm bài"
    │
    ▼
T+0 (Submit): "Bạn đã hoàn thành khóa học"
    │
    ├─> Pass: "Chúc mừng! Bạn đã đậu"
    │       └─> "Chứng chỉ đã được tạo"
    │
    └─> Fail: "Bạn chưa đạt yêu cầu, vui lòng làm lại"
```

## 📊 DATA RELATIONSHIP

```
CourseSet
    │
    ├─> Course (1:N)
    │       │
    │       ├─> QuestionBank (1:1)
    │       │       │
    │       │       └─> Questions (1:N)
    │       │
    │       └─> TrainingSession (1:N)
    │               │
    │               └─> TrainingEnrollment (1:N)
    │                       │
    │                       ├─> User (N:1)
    │                       │
    │                       ├─> TrainingProgress (1:1)
    │                       │
    │                       ├─> TrainingHistory (1:N)
    │                       │
    │                       └─> TrainingCertificate (1:1)
```

## 🎯 DECISION TREE - ENROLLMENT

```
                    Start Enrollment
                           │
                           ▼
                    ┌──────────────┐
                    │ Check Prereq  │
                    └──────┬───────┘
                           │
            ┌──────────────┴──────────────┐
            │                            │
         No/Empty                    Has Prereq
            │                            │
            ▼                            ▼
    ┌──────────────┐          ┌──────────────────┐
    │ Check if     │          │ Check if User   │
    │ User completed│          │ completed all   │
    │ prerequisites │          │ prerequisites   │
    └──────┬───────┘          └──────┬──────────┘
           │                          │
    ┌──────┴──────┐          ┌───────┴────────┐
    │             │          │                │
   Yes           No         Yes              No
    │             │          │                │
    ▼             ▼          ▼                ▼
Continue    Show Error  Continue        Show Error
                           │                │
                           │                └─> List prerequisites
                           │
                           ▼
                    ┌──────────────┐
                    │ Find Session │
                    └──────┬───────┘
                           │
            ┌──────────────┴──────────────┐
            │                            │
         Found                        Not Found
            │                            │
            ▼                            ▼
    ┌──────────────┐          ┌──────────────────┐
    │ Check        │          │ Show: "Không có │
    │ Capacity      │          │ session khả dụng"│
    └──────┬───────┘          └──────────────────┘
           │
    ┌──────┴──────┐
    │             │
 Available      Full
    │             │
    ▼             ▼
Create      Show: "Đầy chỗ"
Enrollment  + Suggest others
```

## 🔄 RETRY/RETAKE FLOW

```
                    Failed Training
                           │
                           ▼
                    ┌──────────────┐
                    │ Show Results │
                    │ - Score      │
                    │ - Failed     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Check Session│
                    │ Still Active │
                    └──────┬───────┘
                           │
            ┌──────────────┴──────────────┐
            │                            │
          Yes                          No
            │                            │
            ▼                            ▼
    ┌──────────────┐          ┌──────────────────┐
    │ Show "Retake" │          │ Show: "Session   │
    │ Button       │          │ đã hết hạn"       │
    └──────┬───────┘          └──────────────────┘
           │
           │ (User clicks Retake)
           ▼
    ┌──────────────┐
    │ Reset        │
    │ Enrollment   │
    │ - status: enrolled│
    │ - score: null│
    │ - passed: null│
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Go to Start  │
    │ Training     │
    └──────────────┘
```

## 📝 SUMMARY

### Key Points:
1. **Admin tạo nội dung** → Course Set → Course → Questions → Session
2. **Employee đăng ký** → Validation → Enrollment
3. **Session tự động update status** → SCHEDULED → ONGOING → COMPLETED
4. **Employee làm bài** → Start → Answer → Submit → Results
5. **Auto scoring** → Pass/Fail → Certificate (nếu pass) → Retake (nếu fail)

### Validation Points:
- ✅ Prerequisites check
- ✅ Session capacity check
- ✅ Time validation
- ✅ Status validation
- ✅ Enrollment validation

### Events Triggered:
- 📢 Enrollment created
- 📢 Training started
- 📢 Training completed
- 📢 Training retaken
- 📢 Certificate generated

