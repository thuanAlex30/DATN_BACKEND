# Hướng dẫn tích hợp Kafka vào hệ thống quản lý an toàn lao động

## Mục lục
1. [Tổng quan](#tổng-quan)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Cài đặt và cấu hình](#cài-đặt-và-cấu-hình)
4. [Triển khai từng bước](#triển-khai-từng-bước)
5. [Testing và Monitoring](#testing-và-monitoring)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Tổng quan

### Mục tiêu
- Tích hợp Apache Kafka để xử lý luồng sự kiện real-time
- Tách biệt việc phát hành và xử lý sự kiện
- Tăng khả năng mở rộng và độ tin cậy của hệ thống
- Hỗ trợ phân tích dữ liệu và báo cáo

### Lợi ích mong đợi
- **Hiệu suất**: Xử lý hàng nghìn sự kiện mỗi giây
- **Độ tin cậy**: Đảm bảo không mất dữ liệu
- **Mở rộng**: Dễ dàng thêm consumer mới
- **Giám sát**: Theo dõi luồng dữ liệu real-time

## Kiến trúc hệ thống

### Kiến trúc hiện tại
```
[Frontend React] <---> [WebSocket] <---> [Backend Node.js] <---> [MongoDB]
```

### Kiến trúc sau khi tích hợp Kafka
```
[Frontend React] <---> [WebSocket] <---> [Backend Node.js] <---> [Kafka] <---> [Event Consumers]
                                    <---> [MongoDB]
                                    <---> [WebSocket Broadcast]
```

### Luồng dữ liệu
1. **Event Producer**: Backend API tạo sự kiện và gửi vào Kafka
2. **Event Consumer**: Xử lý sự kiện và cập nhật hệ thống
3. **WebSocket**: Phát sóng thay đổi real-time đến frontend
4. **Database**: Lưu trữ dữ liệu persistent

## Cài đặt và cấu hình

### 1. Cài đặt Kafka Server

#### Docker Compose (Khuyến nghị)
```yaml
# docker-compose.kafka.yml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
```

#### Chạy Kafka
```bash
docker-compose -f docker-compose.kafka.yml up -d
```

### 2. Cài đặt Dependencies

```bash
# Backend dependencies
cd DATN_BACKEND
npm install kafkajs
npm install --save-dev @types/kafkajs

# Frontend dependencies (nếu cần)
cd DATN_FONTEND
npm install kafkajs
```

### 3. Cấu hình Environment Variables

```bash
# .env
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=safety-management-system
KAFKA_GROUP_ID=safety-system-group
KAFKA_AUTO_CREATE_TOPICS=true
KAFKA_RETRY_ATTEMPTS=3
KAFKA_RETRY_DELAY=1000
```

## Triển khai từng bước

### Bước 1: Tạo Kafka Service

#### 1.1 Tạo file `services/kafkaService.js`

```javascript
const { Kafka, logLevel } = require('kafkajs');

class KafkaService {
  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'safety-management-system',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      logLevel: logLevel.INFO,
      retry: {
        initialRetryTime: parseInt(process.env.KAFKA_RETRY_DELAY) || 1000,
        retries: parseInt(process.env.KAFKA_RETRY_ATTEMPTS) || 3
      }
    });
    
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ 
      groupId: process.env.KAFKA_GROUP_ID || 'safety-system-group' 
    });
    
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.isInitialized = true;
      console.log('✅ Kafka service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Kafka service:', error);
      throw error;
    }
  }

  async publishEvent(topic, event) {
    try {
      await this.producer.send({
        topic,
        messages: [{
          key: event.id || event._id || Date.now().toString(),
          value: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
            version: '1.0'
          }),
          timestamp: Date.now()
        }]
      });
      
      console.log(`📤 Event published to topic ${topic}:`, event.type || 'Unknown');
    } catch (error) {
      console.error(`❌ Failed to publish event to topic ${topic}:`, error);
      throw error;
    }
  }

  async subscribeToTopics(topics, messageHandler) {
    try {
      await this.consumer.subscribe({ topics });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            await messageHandler(topic, event);
          } catch (error) {
            console.error(`❌ Error processing message from topic ${topic}:`, error);
          }
        }
      });
      
      console.log(`✅ Subscribed to topics: ${topics.join(', ')}`);
    } catch (error) {
      console.error('❌ Failed to subscribe to topics:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isInitialized = false;
      console.log('✅ Kafka service disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting Kafka service:', error);
    }
  }
}

module.exports = new KafkaService();
```

#### 1.2 Tạo file `config/kafkaTopics.js`

```javascript
const KAFKA_TOPICS = {
  // Quản lý dự án
  PROJECT_EVENTS: 'project.events',
  TASK_EVENTS: 'task.events',
  PROJECT_ASSIGNMENT_EVENTS: 'project.assignment.events',
  
  // An toàn lao động
  INCIDENT_EVENTS: 'incident.events',
  SAFETY_EVENTS: 'safety.events',
  PPE_EVENTS: 'ppe.events',
  
  // Quản lý người dùng
  USER_EVENTS: 'user.events',
  AUTHENTICATION_EVENTS: 'auth.events',
  
  // Hệ thống
  SYSTEM_EVENTS: 'system.events',
  NOTIFICATION_EVENTS: 'notification.events',
  
  // Đào tạo
  TRAINING_EVENTS: 'training.events',
  
  // Báo cáo
  REPORT_EVENTS: 'report.events'
};

const EVENT_TYPES = {
  // Project events
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_DELETED: 'PROJECT_DELETED',
  PROJECT_STATUS_CHANGED: 'PROJECT_STATUS_CHANGED',
  
  // Task events
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_PROGRESS_UPDATED: 'TASK_PROGRESS_UPDATED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  
  // Incident events
  INCIDENT_REPORTED: 'INCIDENT_REPORTED',
  INCIDENT_CLASSIFIED: 'INCIDENT_CLASSIFIED',
  INCIDENT_ASSIGNED: 'INCIDENT_ASSIGNED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  
  // User events
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  
  // System events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING',
  SYSTEM_INFO: 'SYSTEM_INFO'
};

module.exports = { KAFKA_TOPICS, EVENT_TYPES };
```

### Bước 2: Tích hợp vào Controllers hiện có

#### 2.1 Cập nhật `controllers/projectController.js`

```javascript
const kafkaService = require('../services/kafkaService');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../config/kafkaTopics');

class ProjectController {
  // ... existing code ...

  static createProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const projectData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.createProject(projectData, userId);
    
    if (result.success && result.data) {
      // Publish event to Kafka
      await kafkaService.publishEvent(KAFKA_TOPICS.PROJECT_EVENTS, {
        type: EVENT_TYPES.PROJECT_CREATED,
        projectId: result.data._id,
        projectName: result.data.project_name,
        userId: userId,
        userEmail: req.user.email,
        timestamp: new Date()
      });

      // Emit WebSocket event
      websocketService.emitProjectCreated(result.data, req.user);
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 201);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static updateProject = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectService.updateProject(id, updateData, userId);
    
    if (result.success && result.data) {
      // Publish event to Kafka
      await kafkaService.publishEvent(KAFKA_TOPICS.PROJECT_EVENTS, {
        type: EVENT_TYPES.PROJECT_UPDATED,
        projectId: id,
        changes: updateData,
        userId: userId,
        userEmail: req.user.email,
        timestamp: new Date()
      });

      // Emit WebSocket event
      websocketService.emitProjectUpdated(result.data, req.user);
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, 200);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ... existing code ...
}
```

#### 2.2 Cập nhật `controllers/projectTaskController.js`

```javascript
const kafkaService = require('../services/kafkaService');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../config/kafkaTopics');

class ProjectTaskController {
  // ... existing code ...

  static updateTaskProgress = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.user._id || req.user.id;
    
    if (progress < 0 || progress > 100) {
      return ApiResponse.error(res, 'Tiến độ phải từ 0 đến 100', 400);
    }
    
    const result = await projectTaskService.updateTaskProgress(id, progress, userId);
    
    if (result.success && result.data) {
      // Publish event to Kafka
      await kafkaService.publishEvent(KAFKA_TOPICS.TASK_EVENTS, {
        type: EVENT_TYPES.TASK_PROGRESS_UPDATED,
        taskId: id,
        progress: progress,
        projectId: result.data.project_id,
        userId: userId,
        userEmail: req.user.email,
        timestamp: new Date()
      });

      // Emit WebSocket event
      websocketService.emitToAll('task_progress_updated', {
        task: result.data,
        updater: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  static assignTask = ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignee_id } = req.body;
    const userId = req.user._id || req.user.id;
    
    const result = await projectTaskService.assignTask(id, assignee_id, userId);
    
    if (result.success && result.data) {
      // Publish event to Kafka
      await kafkaService.publishEvent(KAFKA_TOPICS.TASK_EVENTS, {
        type: EVENT_TYPES.TASK_ASSIGNED,
        taskId: id,
        assigneeId: assignee_id,
        assignerId: userId,
        assignerEmail: req.user.email,
        timestamp: new Date()
      });

      // Emit WebSocket event
      websocketService.emitToAll('task_assigned', {
        task: result.data,
        assigner: req.user,
        timestamp: new Date()
      });
    }
    
    if (result.success) {
      return ApiResponse.success(res, result.data, result.message, result.statusCode);
    } else {
      return ApiResponse.error(res, result.message, result.statusCode || 400, result.data);
    }
  });

  // ... existing code ...
}
```

#### 2.3 Cập nhật `controllers/incidentController.js`

```javascript
const kafkaService = require('../services/kafkaService');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../config/kafkaTopics');

// ... existing code ...

exports.reportIncident = async (req, res) => {
  try {
    const { title, description, images, location, severity } = req.body;
    const incidentId = 'INC' + Date.now();
    
    const incident = new Incident({
      title,
      description,
      images,
      location,
      severity,
      incidentId,
      createdBy: req.user._id,
      histories: [{ action: 'Ghi nhận', performedBy: req.user._id, note: 'Ghi nhận sự cố' }]
    });
    
    await incident.save();
    
    // Publish event to Kafka
    await kafkaService.publishEvent(KAFKA_TOPICS.INCIDENT_EVENTS, {
      type: EVENT_TYPES.INCIDENT_REPORTED,
      incidentId: incident._id,
      incidentCode: incident.incidentId,
      title: title,
      severity: severity,
      location: location,
      reporterId: req.user._id,
      reporterEmail: req.user.email,
      timestamp: new Date()
    });
    
    // Emit WebSocket event
    websocketService.emitIncidentReported(incident, req.user);
    
    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.classifyIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { severity } = req.body;
    
    const incident = await Incident.findById(id);
    if (!incident) return res.status(404).json({ error: 'Không tìm thấy sự cố' });
    
    incident.severity = severity;
    incident.status = 'Đang xử lý';
    incident.histories.push({ 
      action: 'Phân loại', 
      performedBy: req.user._id, 
      note: `Phân loại: ${severity}` 
    });
    
    await incident.save();
    
    // Publish event to Kafka
    await kafkaService.publishEvent(KAFKA_TOPICS.INCIDENT_EVENTS, {
      type: EVENT_TYPES.INCIDENT_CLASSIFIED,
      incidentId: id,
      incidentCode: incident.incidentId,
      severity: severity,
      classifierId: req.user._id,
      classifierEmail: req.user.email,
      timestamp: new Date()
    });
    
    // Emit WebSocket event
    websocketService.emitIncidentClassified(incident, req.user);
    
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ... existing code ...
```

### Bước 3: Tạo Event Consumer

#### 3.1 Tạo file `services/eventConsumer.js`

```javascript
const kafkaService = require('./kafkaService');
const websocketService = require('./websocketService');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../config/kafkaTopics');
const User = require('../models/user');
const Project = require('../models/project');
const ProjectTask = require('../models/projectTask');
const Incident = require('../models/incident');

class EventConsumer {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    try {
      await kafkaService.initialize();
      
      const topics = Object.values(KAFKA_TOPICS);
      await kafkaService.subscribeToTopics(topics, this.handleMessage.bind(this));
      
      this.isRunning = true;
      console.log('✅ Event consumer started successfully');
    } catch (error) {
      console.error('❌ Failed to start event consumer:', error);
      throw error;
    }
  }

  async handleMessage(topic, event) {
    try {
      console.log(`📥 Processing event from topic ${topic}:`, event.type);
      
      switch (topic) {
        case KAFKA_TOPICS.PROJECT_EVENTS:
          await this.handleProjectEvent(event);
          break;
        case KAFKA_TOPICS.TASK_EVENTS:
          await this.handleTaskEvent(event);
          break;
        case KAFKA_TOPICS.INCIDENT_EVENTS:
          await this.handleIncidentEvent(event);
          break;
        case KAFKA_TOPICS.USER_EVENTS:
          await this.handleUserEvent(event);
          break;
        case KAFKA_TOPICS.SYSTEM_EVENTS:
          await this.handleSystemEvent(event);
          break;
        default:
          console.log(`⚠️ Unknown topic: ${topic}`);
      }
    } catch (error) {
      console.error(`❌ Error handling message from topic ${topic}:`, error);
    }
  }

  async handleProjectEvent(event) {
    switch (event.type) {
      case EVENT_TYPES.PROJECT_CREATED:
        await this.onProjectCreated(event);
        break;
      case EVENT_TYPES.PROJECT_UPDATED:
        await this.onProjectUpdated(event);
        break;
      case EVENT_TYPES.PROJECT_STATUS_CHANGED:
        await this.onProjectStatusChanged(event);
        break;
    }
  }

  async handleTaskEvent(event) {
    switch (event.type) {
      case EVENT_TYPES.TASK_CREATED:
        await this.onTaskCreated(event);
        break;
      case EVENT_TYPES.TASK_ASSIGNED:
        await this.onTaskAssigned(event);
        break;
      case EVENT_TYPES.TASK_PROGRESS_UPDATED:
        await this.onTaskProgressUpdated(event);
        break;
      case EVENT_TYPES.TASK_COMPLETED:
        await this.onTaskCompleted(event);
        break;
    }
  }

  async handleIncidentEvent(event) {
    switch (event.type) {
      case EVENT_TYPES.INCIDENT_REPORTED:
        await this.onIncidentReported(event);
        break;
      case EVENT_TYPES.INCIDENT_CLASSIFIED:
        await this.onIncidentClassified(event);
        break;
      case EVENT_TYPES.INCIDENT_RESOLVED:
        await this.onIncidentResolved(event);
        break;
    }
  }

  async handleUserEvent(event) {
    switch (event.type) {
      case EVENT_TYPES.USER_LOGIN:
        await this.onUserLogin(event);
        break;
      case EVENT_TYPES.USER_LOGOUT:
        await this.onUserLogout(event);
        break;
      case EVENT_TYPES.USER_ROLE_CHANGED:
        await this.onUserRoleChanged(event);
        break;
    }
  }

  async handleSystemEvent(event) {
    switch (event.type) {
      case EVENT_TYPES.SYSTEM_ERROR:
        await this.onSystemError(event);
        break;
      case EVENT_TYPES.SYSTEM_WARNING:
        await this.onSystemWarning(event);
        break;
    }
  }

  // Project event handlers
  async onProjectCreated(event) {
    console.log(`📋 Project created: ${event.projectName} by ${event.userEmail}`);
    
    // Có thể thêm logic xử lý như:
    // - Gửi email thông báo
    // - Tạo dashboard mới
    // - Cập nhật thống kê
  }

  async onProjectUpdated(event) {
    console.log(`📋 Project updated: ${event.projectId} by ${event.userEmail}`);
    
    // Có thể thêm logic xử lý như:
    // - Ghi log thay đổi
    // - Cập nhật cache
    // - Thông báo stakeholders
  }

  async onProjectStatusChanged(event) {
    console.log(`📋 Project status changed: ${event.projectId} to ${event.status}`);
    
    // Có thể thêm logic xử lý như:
    // - Gửi thông báo real-time
    // - Cập nhật timeline
    // - Trigger workflows
  }

  // Task event handlers
  async onTaskCreated(event) {
    console.log(`📝 Task created: ${event.taskName} in project ${event.projectId}`);
  }

  async onTaskAssigned(event) {
    console.log(`📝 Task assigned: ${event.taskId} to user ${event.assigneeId}`);
    
    // Gửi thông báo cho người được phân công
    const assignee = await User.findById(event.assigneeId);
    if (assignee) {
      websocketService.emitToUser(assignee._id, 'task_assigned_notification', {
        taskId: event.taskId,
        assigner: event.assignerEmail,
        message: 'Bạn đã được phân công một nhiệm vụ mới'
      });
    }
  }

  async onTaskProgressUpdated(event) {
    console.log(`📝 Task progress updated: ${event.taskId} to ${event.progress}%`);
    
    // Có thể thêm logic xử lý như:
    // - Cập nhật dashboard
    // - Gửi thông báo cho manager
    // - Trigger milestone checks
  }

  async onTaskCompleted(event) {
    console.log(`📝 Task completed: ${event.taskId}`);
    
    // Có thể thêm logic xử lý như:
    // - Cập nhật project progress
    // - Gửi thông báo hoàn thành
    // - Trigger next tasks
  }

  // Incident event handlers
  async onIncidentReported(event) {
    console.log(`🚨 Incident reported: ${event.incidentCode} - ${event.title}`);
    
    // Có thể thêm logic xử lý như:
    // - Gửi SMS khẩn cấp
    // - Tạo ticket tự động
    // - Thông báo safety officer
  }

  async onIncidentClassified(event) {
    console.log(`🚨 Incident classified: ${event.incidentCode} as ${event.severity}`);
    
    // Có thể thêm logic xử lý như:
    // - Gửi thông báo theo mức độ
    // - Tạo action plan
    // - Cập nhật dashboard
  }

  async onIncidentResolved(event) {
    console.log(`🚨 Incident resolved: ${event.incidentCode}`);
    
    // Có thể thêm logic xử lý như:
    // - Gửi thông báo giải quyết
    // - Tạo báo cáo
    // - Cập nhật thống kê
  }

  // User event handlers
  async onUserLogin(event) {
    console.log(`👤 User logged in: ${event.userEmail}`);
    
    // Có thể thêm logic xử lý như:
    // - Ghi log hoạt động
    // - Cập nhật trạng thái online
    // - Gửi thông báo chào mừng
  }

  async onUserLogout(event) {
    console.log(`👤 User logged out: ${event.userEmail}`);
    
    // Có thể thêm logic xử lý như:
    // - Ghi log hoạt động
    // - Cập nhật trạng thái offline
    // - Lưu session data
  }

  async onUserRoleChanged(event) {
    console.log(`👤 User role changed: ${event.userEmail} to ${event.newRole}`);
    
    // Có thể thêm logic xử lý như:
    // - Gửi thông báo thay đổi quyền
    // - Cập nhật permissions
    // - Log audit trail
  }

  // System event handlers
  async onSystemError(event) {
    console.error(`❌ System error: ${event.message}`);
    
    // Có thể thêm logic xử lý như:
    // - Gửi alert cho admin
    // - Ghi log lỗi
    // - Tạo ticket tự động
  }

  async onSystemWarning(event) {
    console.warn(`⚠️ System warning: ${event.message}`);
    
    // Có thể thêm logic xử lý như:
    // - Gửi thông báo
    // - Ghi log cảnh báo
    // - Cập nhật monitoring
  }

  async stop() {
    if (!this.isRunning) return;
    
    try {
      await kafkaService.disconnect();
      this.isRunning = false;
      console.log('✅ Event consumer stopped');
    } catch (error) {
      console.error('❌ Error stopping event consumer:', error);
    }
  }
}

module.exports = new EventConsumer();
```

### Bước 4: Cập nhật Server.js

#### 4.1 Cập nhật `server.js`

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import services
const websocketService = require('./services/websocketService');
const kafkaService = require('./services/kafkaService');
const eventConsumer = require('./services/eventConsumer');

// Import middleware
const ErrorMiddleware = require('./middlewares/ErrorMiddleware');
const LoggingMiddleware = require('./middlewares/LoggingMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const projectTaskRoutes = require('./routes/projectTaskRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const safetyRoutes = require('./routes/safetyRoutes');
const ppeRoutes = require('./routes/ppeRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize WebSocket service
websocketService.initialize(io);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));
app.use(LoggingMiddleware.logRequest);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-tasks', projectTaskRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/ppe', ppeRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    kafka: kafkaService.isInitialized ? 'Connected' : 'Disconnected',
    websocket: websocketService.isInitialized ? 'Connected' : 'Disconnected'
  });
});

// Error handling
app.use(ErrorMiddleware.handleNotFound);
app.use(ErrorMiddleware.handleError);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/safety_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Initialize services
async function initializeServices() {
  try {
    // Initialize Kafka service
    await kafkaService.initialize();
    
    // Start event consumer
    await eventConsumer.start();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  try {
    await eventConsumer.stop();
    await kafkaService.disconnect();
    await mongoose.connection.close();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  try {
    await eventConsumer.stop();
    await kafkaService.disconnect();
    await mongoose.connection.close();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeServices();
});

module.exports = app;
```

### Bước 5: Tạo Monitoring và Logging

#### 5.1 Tạo file `services/monitoringService.js`

```javascript
const kafkaService = require('./kafkaService');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../config/kafkaTopics');

class MonitoringService {
  constructor() {
    this.metrics = {
      eventsPublished: 0,
      eventsConsumed: 0,
      errors: 0,
      lastEventTime: null,
      topics: {}
    };
  }

  async publishMonitoringEvent(eventType, data) {
    try {
      await kafkaService.publishEvent(KAFKA_TOPICS.SYSTEM_EVENTS, {
        type: eventType,
        data: data,
        timestamp: new Date(),
        service: 'monitoring'
      });
      
      this.metrics.eventsPublished++;
      this.metrics.lastEventTime = new Date();
    } catch (error) {
      console.error('❌ Failed to publish monitoring event:', error);
      this.metrics.errors++;
    }
  }

  async logSystemError(error, context = {}) {
    await this.publishMonitoringEvent(EVENT_TYPES.SYSTEM_ERROR, {
      error: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date()
    });
  }

  async logSystemWarning(message, context = {}) {
    await this.publishMonitoringEvent(EVENT_TYPES.SYSTEM_WARNING, {
      message: message,
      context: context,
      timestamp: new Date()
    });
  }

  async logSystemInfo(message, context = {}) {
    await this.publishMonitoringEvent(EVENT_TYPES.SYSTEM_INFO, {
      message: message,
      context: context,
      timestamp: new Date()
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  resetMetrics() {
    this.metrics = {
      eventsPublished: 0,
      eventsConsumed: 0,
      errors: 0,
      lastEventTime: null,
      topics: {}
    };
  }
}

module.exports = new MonitoringService();
```

#### 5.2 Tạo file `routes/monitoringRoutes.js`

```javascript
const express = require('express');
const monitoringService = require('../services/monitoringService');
const kafkaService = require('../services/kafkaService');
const websocketService = require('../services/websocketService');

const router = express.Router();

// Get system metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
      error: error.message
    });
  }
});

// Get Kafka status
router.get('/kafka/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        initialized: kafkaService.isInitialized,
        status: kafkaService.isInitialized ? 'Connected' : 'Disconnected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Kafka status',
      error: error.message
    });
  }
});

// Get WebSocket status
router.get('/websocket/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        initialized: websocketService.isInitialized,
        status: websocketService.isInitialized ? 'Connected' : 'Disconnected',
        connectedClients: websocketService.getConnectedClientsCount()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get WebSocket status',
      error: error.message
    });
  }
});

// Reset metrics
router.post('/metrics/reset', (req, res) => {
  try {
    monitoringService.resetMetrics();
    res.json({
      success: true,
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset metrics',
      error: error.message
    });
  }
});

module.exports = router;
```

## Testing và Monitoring

### 1. Unit Tests

#### 1.1 Tạo file `tests/kafkaService.test.js`

```javascript
const kafkaService = require('../services/kafkaService');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../config/kafkaTopics');

describe('KafkaService', () => {
  beforeAll(async () => {
    await kafkaService.initialize();
  });

  afterAll(async () => {
    await kafkaService.disconnect();
  });

  test('should publish event successfully', async () => {
    const event = {
      type: EVENT_TYPES.PROJECT_CREATED,
      projectId: 'test-project-id',
      userId: 'test-user-id',
      timestamp: new Date()
    };

    await expect(
      kafkaService.publishEvent(KAFKA_TOPICS.PROJECT_EVENTS, event)
    ).resolves.not.toThrow();
  });

  test('should handle publish error gracefully', async () => {
    const event = {
      type: EVENT_TYPES.PROJECT_CREATED,
      projectId: 'test-project-id',
      userId: 'test-user-id',
      timestamp: new Date()
    };

    // Mock error scenario
    jest.spyOn(kafkaService.producer, 'send').mockRejectedValue(new Error('Publish failed'));

    await expect(
      kafkaService.publishEvent(KAFKA_TOPICS.PROJECT_EVENTS, event)
    ).rejects.toThrow('Publish failed');
  });
});
```

#### 1.2 Tạo file `tests/eventConsumer.test.js`

```javascript
const eventConsumer = require('../services/eventConsumer');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../config/kafkaTopics');

describe('EventConsumer', () => {
  beforeAll(async () => {
    await eventConsumer.start();
  });

  afterAll(async () => {
    await eventConsumer.stop();
  });

  test('should handle project event', async () => {
    const event = {
      type: EVENT_TYPES.PROJECT_CREATED,
      projectId: 'test-project-id',
      projectName: 'Test Project',
      userId: 'test-user-id',
      userEmail: 'test@example.com',
      timestamp: new Date()
    };

    await expect(
      eventConsumer.handleMessage(KAFKA_TOPICS.PROJECT_EVENTS, event)
    ).resolves.not.toThrow();
  });

  test('should handle task event', async () => {
    const event = {
      type: EVENT_TYPES.TASK_ASSIGNED,
      taskId: 'test-task-id',
      assigneeId: 'test-assignee-id',
      assignerId: 'test-assigner-id',
      assignerEmail: 'assigner@example.com',
      timestamp: new Date()
    };

    await expect(
      eventConsumer.handleMessage(KAFKA_TOPICS.TASK_EVENTS, event)
    ).resolves.not.toThrow();
  });
});
```

### 2. Integration Tests

#### 2.1 Tạo file `tests/integration/kafkaIntegration.test.js`

```javascript
const request = require('supertest');
const app = require('../../server');
const kafkaService = require('../../services/kafkaService');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../../config/kafkaTopics');

describe('Kafka Integration Tests', () => {
  beforeAll(async () => {
    await kafkaService.initialize();
  });

  afterAll(async () => {
    await kafkaService.disconnect();
  });

  test('should create project and publish event', async () => {
    const projectData = {
      project_name: 'Test Project',
      description: 'Test Description',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    const response = await request(app)
      .post('/api/projects')
      .send(projectData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('_id');
  });

  test('should update task progress and publish event', async () => {
    const progressData = {
      progress: 50
    };

    const response = await request(app)
      .put('/api/project-tasks/test-task-id/progress')
      .send(progressData)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### 3. Performance Tests

#### 3.1 Tạo file `tests/performance/kafkaPerformance.test.js`

```javascript
const kafkaService = require('../../services/kafkaService');
const { KAFKA_TOPICS, EVENT_TYPES } = require('../../config/kafkaTopics');

describe('Kafka Performance Tests', () => {
  beforeAll(async () => {
    await kafkaService.initialize();
  });

  afterAll(async () => {
    await kafkaService.disconnect();
  });

  test('should handle high volume of events', async () => {
    const startTime = Date.now();
    const eventCount = 1000;
    const promises = [];

    for (let i = 0; i < eventCount; i++) {
      const event = {
        type: EVENT_TYPES.PROJECT_CREATED,
        projectId: `test-project-${i}`,
        userId: `test-user-${i}`,
        timestamp: new Date()
      };

      promises.push(
        kafkaService.publishEvent(KAFKA_TOPICS.PROJECT_EVENTS, event)
      );
    }

    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Published ${eventCount} events in ${duration}ms`);
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });
});
```

## Troubleshooting

### 1. Lỗi thường gặp

#### 1.1 Kafka Connection Issues
```bash
# Kiểm tra Kafka server
docker-compose -f docker-compose.kafka.yml ps

# Kiểm tra logs
docker-compose -f docker-compose.kafka.yml logs kafka

# Restart Kafka
docker-compose -f docker-compose.kafka.yml restart kafka
```

#### 1.2 Topic không tồn tại
```bash
# Tạo topic thủ công
docker exec -it kafka kafka-topics --create --topic project.events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
```

#### 1.3 Consumer không nhận được message
```javascript
// Kiểm tra consumer group
const admin = kafkaService.kafka.admin();
await admin.connect();
const groups = await admin.listGroups();
console.log('Consumer groups:', groups);
await admin.disconnect();
```

### 2. Debug Commands

#### 2.1 Kiểm tra Kafka Topics
```bash
# List all topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Describe topic
docker exec -it kafka kafka-topics --describe --topic project.events --bootstrap-server localhost:9092
```

#### 2.2 Kiểm tra Consumer Groups
```bash
# List consumer groups
docker exec -it kafka kafka-consumer-groups --list --bootstrap-server localhost:9092

# Describe consumer group
docker exec -it kafka kafka-consumer-groups --describe --group safety-system-group --bootstrap-server localhost:9092
```

#### 2.3 Kiểm tra Messages
```bash
# Consume messages from topic
docker exec -it kafka kafka-console-consumer --topic project.events --from-beginning --bootstrap-server localhost:9092
```

### 3. Monitoring Commands

#### 3.1 Health Check
```bash
# Kiểm tra health endpoint
curl http://localhost:5000/health

# Kiểm tra metrics
curl http://localhost:5000/api/monitoring/metrics
```

#### 3.2 Log Analysis
```bash
# Xem logs real-time
tail -f logs/app.log | grep -i kafka

# Xem error logs
grep -i error logs/app.log | tail -20
```

## Best Practices

### 1. Event Design

#### 1.1 Event Schema
```javascript
const eventSchema = {
  id: 'string',           // Unique event ID
  type: 'string',         // Event type
  version: 'string',      // Schema version
  timestamp: 'string',    // ISO timestamp
  source: 'string',       // Service that generated the event
  data: 'object',         // Event payload
  metadata: 'object'      // Additional metadata
};
```

#### 1.2 Event Naming Convention
```javascript
// Good naming
PROJECT_CREATED
TASK_ASSIGNED
INCIDENT_REPORTED

// Bad naming
project_created
taskAssigned
incidentReported
```

### 2. Error Handling

#### 2.1 Retry Strategy
```javascript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};
```

#### 2.2 Dead Letter Queue
```javascript
// Tạo DLQ topic
const dlqTopic = `${originalTopic}.dlq`;

// Xử lý message failed
await kafkaService.publishEvent(dlqTopic, {
  originalMessage: message,
  error: error.message,
  timestamp: new Date()
});
```

### 3. Performance Optimization

#### 3.1 Batch Processing
```javascript
// Batch multiple events
const events = [
  { type: 'PROJECT_CREATED', data: project1 },
  { type: 'PROJECT_CREATED', data: project2 },
  { type: 'PROJECT_CREATED', data: project3 }
];

await kafkaService.producer.send({
  topic: KAFKA_TOPICS.PROJECT_EVENTS,
  messages: events.map(event => ({
    key: event.data.id,
    value: JSON.stringify(event)
  }))
});
```

#### 3.2 Compression
```javascript
const kafka = new Kafka({
  clientId: 'safety-management-system',
  brokers: ['localhost:9092'],
  compression: CompressionTypes.GZIP
});
```

### 4. Security

#### 4.1 Authentication
```javascript
const kafka = new Kafka({
  clientId: 'safety-management-system',
  brokers: ['localhost:9092'],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  }
});
```

#### 4.2 Encryption
```javascript
// Encrypt sensitive data
const encryptedData = encrypt(JSON.stringify(event.data));
const secureEvent = {
  ...event,
  data: encryptedData,
  encrypted: true
};
```

### 5. Monitoring và Alerting

#### 5.1 Metrics Collection
```javascript
// Collect custom metrics
const metrics = {
  eventsPerSecond: 0,
  averageLatency: 0,
  errorRate: 0,
  consumerLag: 0
};
```

#### 5.2 Alerting Rules
```javascript
// Alert rules
const alertRules = {
  highErrorRate: { threshold: 0.05, action: 'email' },
  highLatency: { threshold: 1000, action: 'sms' },
  consumerLag: { threshold: 1000, action: 'slack' }
};
```

## Kết luận

Hướng dẫn này cung cấp một lộ trình rõ ràng để tích hợp Kafka vào hệ thống quản lý an toàn lao động. Các bước chính bao gồm:

1. **Cài đặt và cấu hình**: Thiết lập Kafka server và dependencies
2. **Tạo services**: KafkaService, EventConsumer, MonitoringService
3. **Tích hợp controllers**: Cập nhật các controller hiện có
4. **Testing**: Unit tests, integration tests, performance tests
5. **Monitoring**: Health checks, metrics, logging
6. **Troubleshooting**: Xử lý lỗi thường gặp
7. **Best practices**: Thiết kế event, xử lý lỗi, tối ưu hiệu suất

Việc tích hợp Kafka sẽ giúp hệ thống trở nên:
- **Mở rộng hơn**: Xử lý được nhiều sự kiện đồng thời
- **Tin cậy hơn**: Đảm bảo không mất dữ liệu
- **Linh hoạt hơn**: Dễ dàng thêm consumer mới
- **Giám sát tốt hơn**: Theo dõi luồng dữ liệu real-time

Hãy bắt đầu với việc cài đặt Kafka server và tạo KafkaService, sau đó dần dần tích hợp vào các module khác của hệ thống.