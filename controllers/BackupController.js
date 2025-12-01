const BackupRecord = require('../models/backupRecord');
const { ApiResponse } = require('../utils/response');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');
const fs = require('fs').promises;
const path = require('path');

class BackupController {
  // Start backup
  static startBackup = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { backup_type, storage_location, compress } = req.body;
      const userId = req.user?.id;

      // Create backup record
      const backupRecord = new BackupRecord({
        backup_type,
        storage_location,
        status: 'IN_PROGRESS',
        started_by: userId
      });
      await backupRecord.save();

      // Start backup process asynchronously (in production, use a job queue)
      setImmediate(async () => {
        try {
          // Simulate backup process
          // In production, implement actual backup logic here
          const backupDir = path.join(__dirname, '../../backups');
          await fs.mkdir(backupDir, { recursive: true });
          
          const fileName = `backup_${backupRecord._id}_${Date.now()}.${compress ? 'tar.gz' : 'tar'}`;
          const filePath = path.join(backupDir, fileName);
          
          // Simulate file creation (in production, create actual backup)
          await fs.writeFile(filePath, 'backup content');
          const stats = await fs.stat(filePath);

          // Update backup record
          backupRecord.status = 'SUCCESS';
          backupRecord.file_path = filePath;
          backupRecord.file_size = stats.size;
          backupRecord.completed_at = new Date();
          await backupRecord.save();
        } catch (error) {
          console.error('Backup process error:', error);
          backupRecord.status = 'FAILED';
          backupRecord.error_message = error.message;
          backupRecord.completed_at = new Date();
          await backupRecord.save();
        }
      });

      return ApiResponse.success(res, backupRecord, 'Backup started successfully', 202);
    } catch (error) {
      console.error('Error starting backup:', error);
      return ApiResponse.error(res, 'Failed to start backup', 500);
    }
  });

  // Get backup history
  static getBackupHistory = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const backups = await BackupRecord.find({})
        .sort({ created_at: -1 })
        .populate('started_by', 'username full_name')
        .limit(100);
      
      return ApiResponse.success(res, backups, 'Backup history retrieved successfully');
    } catch (error) {
      console.error('Error getting backup history:', error);
      return ApiResponse.error(res, 'Failed to retrieve backup history', 500);
    }
  });

  // Get backup by ID
  static getBackupById = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const backup = await BackupRecord.findById(id).populate('started_by', 'username full_name');

      if (!backup) {
        return ApiResponse.notFound(res, 'Backup record not found');
      }

      return ApiResponse.success(res, backup, 'Backup record retrieved successfully');
    } catch (error) {
      console.error('Error getting backup:', error);
      return ApiResponse.error(res, 'Failed to retrieve backup record', 500);
    }
  });

  // Restore backup
  static restoreBackup = ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const backup = await BackupRecord.findById(id);

      if (!backup) {
        return ApiResponse.notFound(res, 'Backup record not found');
      }

      if (backup.status !== 'SUCCESS') {
        return ApiResponse.error(res, 'Cannot restore from failed or incomplete backup', 400);
      }

      if (!backup.file_path) {
        return ApiResponse.error(res, 'Backup file not found', 404);
      }

      // In production, implement actual restore logic here
      // This is a placeholder
      return ApiResponse.success(res, { message: 'Restore process started' }, 'Restore process started successfully', 202);
    } catch (error) {
      console.error('Error restoring backup:', error);
      return ApiResponse.error(res, 'Failed to restore backup', 500);
    }
  });
}

module.exports = BackupController;

