/**
 * Utility functions for transforming MongoDB _id to id for frontend compatibility
 */

/**
 * Safe ObjectId to string conversion
 * @param {*} objectId - ObjectId or string
 * @returns {string} - String representation
 */
function safeObjectIdToString(objectId) {
  if (!objectId) return null;
  
  try {
    if (typeof objectId === 'string') {
      return objectId;
    }
    
    if (typeof objectId === 'object' && objectId.toString) {
      return objectId.toString();
    }
    
    // Fallback for corrupted ObjectIds
    if (typeof objectId === 'object' && objectId._id) {
      return objectId._id.toString();
    }
    
    return String(objectId);
  } catch (error) {
    console.warn('Error converting ObjectId to string:', error.message);
    return 'invalid_id';
  }
}

/**
 * Deep clone object with safe ObjectId handling
 * @param {*} obj - Object to clone
 * @returns {*} - Cloned object
 */
function safeClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => safeClone(item));
  }
  
  // Handle ObjectId
  if (obj.constructor && obj.constructor.name === 'ObjectId') {
    return safeObjectIdToString(obj);
  }
  
  // Handle plain objects
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = safeClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Transform a single document's _id to id and handle populated fields
 * @param {Object} doc - MongoDB document
 * @param {Array} populatedFields - Array of field names that might be populated
 * @returns {Object} - Transformed document
 */
function transformDocumentId(doc, populatedFields = []) {
  if (!doc) return doc;
  
  // Use safe cloning to avoid ObjectId serialization issues
  // IMPORTANT: Don't use JSON.stringify for populated fields as it will convert objects to strings
  let docObj;
  try {
    docObj = doc.toObject ? doc.toObject() : doc;
    // Use safeClone but preserve populated objects
    docObj = safeClone(docObj);
    
    // Log populated fields before cloning to debug
    if (populatedFields.length > 0) {
      populatedFields.forEach(field => {
        if (docObj[field]) {
          console.log(`🔍 Before clone - ${field}:`, {
            type: typeof docObj[field],
            isObject: typeof docObj[field] === 'object',
            hasId: docObj[field]._id ? true : false,
            keys: typeof docObj[field] === 'object' ? Object.keys(docObj[field]) : null
          });
        }
      });
    }
  } catch (error) {
    console.warn('Error cloning document, using fallback:', error.message);
    // For populated fields, we need to preserve objects, so use a different approach
    docObj = doc.toObject ? doc.toObject() : doc;
    // Don't use JSON.stringify as it will convert populated objects incorrectly
  }
  
  // Transform main _id to id
  if (docObj._id) {
    try {
      docObj.id = safeObjectIdToString(docObj._id);
      delete docObj._id;
    } catch (error) {
      console.error('Error transforming _id to string:', error.message);
      docObj.id = 'invalid_id';
      delete docObj._id;
    }
  }
  
  // Transform populated fields
  populatedFields.forEach(field => {
    if (docObj[field] && typeof docObj[field] === 'object') {
      // Check if it's a populated object (has _id and other fields)
      if (docObj[field]._id && Object.keys(docObj[field]).length > 1) {
        try {
          // Transform the populated object's _id to id
          docObj[field].id = safeObjectIdToString(docObj[field]._id);
          delete docObj[field]._id;
          
          // Recursively transform nested populated fields
          // For user_id, transform nested role_id and department_id
          if (field === 'user_id') {
            if (docObj[field].role_id && typeof docObj[field].role_id === 'object' && docObj[field].role_id._id) {
              docObj[field].role_id.id = safeObjectIdToString(docObj[field].role_id._id);
              delete docObj[field].role_id._id;
            }
            if (docObj[field].department_id && typeof docObj[field].department_id === 'object' && docObj[field].department_id._id) {
              docObj[field].department_id.id = safeObjectIdToString(docObj[field].department_id._id);
              delete docObj[field].department_id._id;
            }
          }
        } catch (error) {
          console.error(`Error transforming ${field}._id to string:`, error.message);
          docObj[field].id = 'invalid_id';
          delete docObj[field]._id;
        }
      }
      // If it's just an ObjectId (not populated), convert to string
      else if (docObj[field]._id && Object.keys(docObj[field]).length === 1) {
        try {
          docObj[field] = safeObjectIdToString(docObj[field]);
        } catch (error) {
          console.error(`Error transforming ${field} ObjectId to string:`, error.message);
          docObj[field] = 'invalid_id';
        }
      }
      // If it's already an ObjectId string, keep it as is
      else if (typeof docObj[field] === 'string' && docObj[field].length === 24) {
        // Already a string, keep as is
      }
    }
  });

  // Special handling for USER model - transform department_id to department
  if (populatedFields.includes('department_id') && docObj.department_id) {
    docObj.department = docObj.department_id;
    delete docObj.department_id;
  }
  
  // Also transform direct ObjectId fields (like category_id) - but skip populated fields
  Object.keys(docObj).forEach(key => {
    if (key.endsWith('_id') && docObj[key] && typeof docObj[key] === 'object') {
      // Skip if this field was already processed as a populated field
      if (populatedFields.includes(key)) {
        // Double check: if it's a populated field but was converted to string, log warning
        if (typeof docObj[key] === 'string') {
          console.warn(`⚠️ Populated field ${key} was converted to string, this should not happen!`);
        }
        return;
      }
      
      // Check if it's a populated object (has _id and other fields) - don't convert to string
      if (docObj[key]._id && Object.keys(docObj[key]).length > 1) {
        // This is a populated object, transform its _id to id but keep the object
        try {
          docObj[key].id = safeObjectIdToString(docObj[key]._id);
          delete docObj[key]._id;
        } catch (error) {
          console.error(`Error transforming ${key}._id to string:`, error.message);
        }
        return;
      }
      
      // Only convert to string if it's a plain ObjectId (not populated)
      try {
        docObj[key] = safeObjectIdToString(docObj[key]);
      } catch (error) {
        console.error(`Error transforming ${key} to string:`, error.message);
        docObj[key] = 'invalid_id';
      }
    }
  });
  
  return docObj;
}

/**
 * Transform an array of documents
 * @param {Array} docs - Array of MongoDB documents
 * @param {Array} populatedFields - Array of field names that might be populated
 * @returns {Array} - Array of transformed documents
 */
function transformDocumentsId(docs, populatedFields = []) {
  if (!Array.isArray(docs)) return docs;
  
  return docs.map(doc => transformDocumentId(doc, populatedFields));
}

/**
 * Common populated fields for different models
 */
const POPULATED_FIELDS = {
  PROJECT: ['leader_id', 'site_id', 'created_by'],
  PROJECT_PHASE: ['project_id', 'responsible_user_id'],
  PROJECT_TASK: ['project_id', 'phase_id', 'area_id', 'location_id', 'responsible_user_id', 'assigned_to', 'parent_task_id'],
  PROJECT_MILESTONE: ['project_id', 'responsible_user_id', 'created_by', 'updated_by'],
  PROJECT_ASSIGNMENT: ['project_id', 'user_id'],
  TASK_ASSIGNMENT: ['task_id', 'user_id'],
  SITE_AREA: ['site_id', 'supervisor_id'],
  WORK_LOCATION: ['area_id', 'created_by', 'updated_by'],
  QUALITY_CHECKPOINT: ['task_id', 'inspector_id'],
  PROJECT_RISK: ['project_id', 'phase_id', 'owner_id'],
  PROJECT_STATUS_REPORT: ['project_id', 'reported_by'],
  MILESTONE_DELIVERABLE: ['milestone_id', 'reviewer_id'],
  TASK_PROGRESS_LOG: ['task_id', 'user_id', 'created_by'],
  RISK_PROGRESS_LOG: ['risk_id', 'user_id'],
  MILESTONE_PROGRESS_LOG: ['milestone_id', 'user_id'],
  PPE_CATEGORY: [],
  PPE_ITEM: ['category_id'],
  PPE_ISSUANCE: ['user_id', 'item_id'],
  PPE_ASSIGNMENT: ['user_id', 'item_id'],
  USER: ['department_id', 'role_id']
};

module.exports = {
  transformDocumentId,
  transformDocumentsId,
  POPULATED_FIELDS
};
