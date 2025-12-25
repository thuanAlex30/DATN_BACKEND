# Recommended MongoDB Indexes

This file lists suggested indexes to improve performance for common queries observed in the backend.
Apply them in your MongoDB shell or migration tool.

## Incidents
- { tenant_id: 1, createdAt: -1 }
- { status: 1 }
- { severity: 1 }
- { assignedTo: 1 }
- { createdBy: 1 }
- { incidentId: 1 }

Example:
```js
db.incidents.createIndex({ tenant_id: 1, createdAt: -1 });
db.incidents.createIndex({ status: 1 });
db.incidents.createIndex({ severity: 1 });
db.incidents.createIndex({ assignedTo: 1 });
db.incidents.createIndex({ createdBy: 1 });
db.incidents.createIndex({ incidentId: 1 });
```

## TrainingEnrollment
- { course_id: 1 }
- { user_id: 1 }
- { tenant_id: 1 }
- { session_id: 1 }
- { status: 1 }

## TrainingSession
- { tenant_id: 1, course_id: 1 }
- { start_time: 1 }

## Users
- { user_id: 1 }
- { tenant_id: 1 }
- { department_id: 1 }

## PPE / Issuance
- { tenant_id: 1, project_id: 1 }
- { user_id: 1 }

## Notes
- Run `db.collection.getIndexes()` before creating duplicates.
- Monitor index size and write amplification for high-write collections.
- For large aggregations, ensure `$match` fields are indexed.



