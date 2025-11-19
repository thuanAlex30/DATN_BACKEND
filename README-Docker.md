# Docker Setup cho Safety Management System với Kafka

## Tổng quan

Docker setup này bao gồm:
- **MongoDB**: Database chính
- **Redis**: Cache và session storage
- **Kafka + Zookeeper**: Message broker cho event streaming
- **Kafka UI**: Web interface để monitor Kafka
- **Backend API**: Node.js application
- **Frontend**: React application (optional)
- **Nginx**: Reverse proxy

## Cấu trúc Files

```
DATN_BACKEND/
├── Dockerfile                 # Backend container
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml   # Production environment
├── .dockerignore             # Docker ignore file
├── env.example               # Environment variables template
└── docker/
    ├── kafka-init.sh         # Kafka topics initialization
    └── docker-entrypoint.sh  # Container entrypoint
```

## Cài đặt và Chạy

### 1. Development Environment

```bash
# Clone repository và cài đặt dependencies
cd DATN_BACKEND
npm install

# Copy environment file
cp env.example .env

# Khởi động tất cả services
npm run docker:up

# Hoặc khởi động từng service
docker-compose up -d mongodb redis zookeeper kafka kafka-ui
npm run docker:up
```

### 2. Production Environment

```bash
# Tạo production environment file
cp env.example .env.prod

# Chỉnh sửa các giá trị production
# MONGODB_URI, JWT_SECRET, etc.

# Khởi động production environment
npm run docker:prod
```

## Services và Ports

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 3000 | Main API server |
| Frontend | 3001 | React application |
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache |
| Kafka | 9092 | Message broker |
| Kafka UI | 8080 | Kafka monitoring |
| Zookeeper | 2181 | Kafka coordination |
| Nginx | 80/443 | Reverse proxy |

## Kafka Topics

Hệ thống tự động tạo 67 topics:

### Incident Topics (11)
- `incident.created`
- `incident.updated`
- `incident.deleted`
- `incident.status.changed`
- `incident.assigned`
- `incident.escalated`
- `incident.resolved`
- `incident.commented`
- `incident.attachment.added`
- `incident.workflow.changed`
- `incident.analytics.updated`

### PPE Topics (12)
- `ppe.created`
- `ppe.updated`
- `ppe.deleted`
- `ppe.assigned`
- `ppe.returned`
- `ppe.maintenance.scheduled`
- `ppe.maintenance.completed`
- `ppe.expired`
- `ppe.inspection.scheduled`
- `ppe.inspection.completed`
- `ppe.analytics.updated`
- `ppe.workflow.changed`

### User Topics (12)
- `user.created`
- `user.updated`
- `user.deleted`
- `user.login`
- `user.logout`
- `user.password.changed`
- `user.role.changed`
- `user.permission.updated`
- `user.profile.updated`
- `user.analytics.updated`
- `user.workflow.changed`
- `user.activity.logged`

### Notification Topics (10)
- `notification.created`
- `notification.sent`
- `notification.delivered`
- `notification.read`
- `notification.failed`
- `notification.bulk.sent`
- `notification.template.updated`
- `notification.preference.updated`
- `notification.analytics.updated`
- `notification.workflow.changed`

### System Topics (10)
- `system.startup`
- `system.shutdown`
- `system.health.check`
- `system.config.updated`
- `system.backup.created`
- `system.backup.restored`
- `system.maintenance.scheduled`
- `system.maintenance.completed`
- `system.analytics.updated`
- `system.workflow.changed`

### Audit Topics (4)
- `audit.user.action`
- `audit.system.event`
- `audit.security.event`
- `audit.compliance.event`

### Analytics Topics (4)
- `analytics.metrics.updated`
- `analytics.dashboard.updated`
- `analytics.report.generated`
- `analytics.workflow.changed`

## Commands

### Docker Commands
```bash
# Development
npm run docker:up          # Khởi động tất cả services
npm run docker:down        # Dừng tất cả services
npm run docker:logs        # Xem logs
npm run docker:restart     # Restart services

# Production
npm run docker:prod        # Khởi động production
npm run docker:prod:down   # Dừng production

# Kafka specific
npm run docker:kafka:topics        # List topics
npm run docker:kafka:create-topics # Verify topics created
```

### Manual Docker Commands
```bash
# Build và chạy
docker-compose build
docker-compose up -d

# Xem logs
docker-compose logs -f backend
docker-compose logs -f kafka

# Restart service
docker-compose restart backend

# Scale services
docker-compose up -d --scale backend=3

# Clean up
docker-compose down -v
docker system prune -a
```

## Monitoring

### Kafka UI
Truy cập http://localhost:8080 để monitor:
- Topics và partitions
- Consumer groups
- Message flow
- Broker status

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Kafka health
docker exec safety-kafka kafka-topics --bootstrap-server localhost:9092 --list

# MongoDB health
docker exec safety-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis health
docker exec safety-redis redis-cli ping
```

## Troubleshooting

### Common Issues

1. **Kafka không khởi động**
```bash
# Kiểm tra logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka
```

2. **Topics không được tạo**
```bash
# Chạy manual topic creation
docker exec safety-kafka-init bash -c 'kafka-topics --bootstrap-server kafka:29092 --list'
```

3. **Backend không kết nối được Kafka**
```bash
# Kiểm tra network
docker network ls
docker network inspect safety-network

# Test connection
docker exec safety-backend nc -z kafka 29092
```

4. **Memory issues**
```bash
# Kiểm tra memory usage
docker stats

# Tăng memory limits trong docker-compose.yml
```

### Logs
```bash
# Tất cả services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f kafka
docker-compose logs -f mongodb
```

## Production Considerations

### Security
- Sử dụng environment variables cho secrets
- Enable SSL/TLS cho production
- Configure firewall rules
- Use secrets management

### Performance
- Tune Kafka settings
- Configure MongoDB indexes
- Set appropriate memory limits
- Use connection pooling

### Monitoring
- Set up health checks
- Configure log aggregation
- Monitor resource usage
- Set up alerts

### Backup
- Regular MongoDB backups
- Kafka topic retention policies
- Configuration backups
- Disaster recovery plan

## Environment Variables

### Required
```bash
NODE_ENV=production
MONGODB_URI=mongodb://user:pass@mongodb:27017/db
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:29092
JWT_SECRET=your-secret-key
```

### Optional
```bash
FRONTEND_URL=https://your-frontend.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
LOG_LEVEL=info
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Use load balancer
# Configure nginx upstream
```

### Vertical Scaling
```bash
# Increase memory limits
# Update docker-compose.yml
# Restart services
```

## Maintenance

### Updates
```bash
# Update images
docker-compose pull
docker-compose up -d

# Update application
git pull
docker-compose build backend
docker-compose up -d backend
```

### Cleanup
```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a
```

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs
2. Verify environment variables
3. Check network connectivity
4. Review resource usage
5. Consult documentation
