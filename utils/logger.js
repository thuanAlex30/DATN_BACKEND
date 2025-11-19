/**
 * Enhanced Logger Utility
 * Provides structured logging with different levels and error tracking
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logDir = process.env.LOG_DIR || './logs';
        this.maxLogSize = parseInt(process.env.MAX_LOG_SIZE) || 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = parseInt(process.env.MAX_LOG_FILES) || 5;
        
        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Get current timestamp
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message
     */
    formatMessage(level, message, metadata = {}) {
        return {
            timestamp: this.getTimestamp(),
            level: level.toUpperCase(),
            message,
            metadata,
            pid: process.pid,
            hostname: require('os').hostname()
        };
    }

    /**
     * Write log to file
     */
    writeToFile(level, message, metadata = {}) {
        try {
            const logEntry = this.formatMessage(level, message, metadata);
            const logFile = path.join(this.logDir, `${level}.log`);
            
            // Check if log file needs rotation
            if (fs.existsSync(logFile)) {
                const stats = fs.statSync(logFile);
                if (stats.size > this.maxLogSize) {
                    this.rotateLogFile(logFile);
                }
            }
            
            fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    /**
     * Rotate log file
     */
    rotateLogFile(logFile) {
        try {
            const logDir = path.dirname(logFile);
            const logName = path.basename(logFile, '.log');
            
            // Remove oldest log file if max files reached
            const existingFiles = fs.readdirSync(logDir)
                .filter(file => file.startsWith(logName) && file.endsWith('.log'))
                .sort();
            
            if (existingFiles.length >= this.maxLogFiles) {
                const oldestFile = path.join(logDir, existingFiles[0]);
                fs.unlinkSync(oldestFile);
            }
            
            // Rename current log file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const newName = `${logName}-${timestamp}.log`;
            fs.renameSync(logFile, path.join(logDir, newName));
            
        } catch (error) {
            console.error('Failed to rotate log file:', error.message);
        }
    }

    /**
     * Check if log level should be logged
     */
    shouldLog(level) {
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        
        return messageLevelIndex <= currentLevelIndex;
    }

    /**
     * Log error message
     */
    error(message, metadata = {}) {
        if (this.shouldLog('error')) {
            console.error(`[ERROR] ${message}`, metadata);
            this.writeToFile('error', message, metadata);
        }
    }

    /**
     * Log warning message
     */
    warn(message, metadata = {}) {
        if (this.shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, metadata);
            this.writeToFile('warn', message, metadata);
        }
    }

    /**
     * Log info message
     */
    info(message, metadata = {}) {
        if (this.shouldLog('info')) {
            console.info(`[INFO] ${message}`, metadata);
            this.writeToFile('info', message, metadata);
        }
    }

    /**
     * Log debug message
     */
    debug(message, metadata = {}) {
        if (this.shouldLog('debug')) {
            console.debug(`[DEBUG] ${message}`, metadata);
            this.writeToFile('debug', message, metadata);
        }
    }

    /**
     * Log with custom level
     */
    log(level, message, metadata = {}) {
        if (this.shouldLog(level)) {
            console.log(`[${level.toUpperCase()}] ${message}`, metadata);
            this.writeToFile(level, message, metadata);
        }
    }

    /**
     * Get log statistics
     */
    getLogStats() {
        try {
            const stats = {
                logDir: this.logDir,
                logLevel: this.logLevel,
                maxLogSize: this.maxLogSize,
                maxLogFiles: this.maxLogFiles,
                files: []
            };

            if (fs.existsSync(this.logDir)) {
                const files = fs.readdirSync(this.logDir);
                stats.files = files.map(file => {
                    const filePath = path.join(this.logDir, file);
                    const fileStats = fs.statSync(filePath);
                    return {
                        name: file,
                        size: fileStats.size,
                        modified: fileStats.mtime
                    };
                });
            }

            return stats;
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Clear old log files
     */
    clearOldLogs(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            if (fs.existsSync(this.logDir)) {
                const files = fs.readdirSync(this.logDir);
                let deletedCount = 0;
                
                files.forEach(file => {
                    const filePath = path.join(this.logDir, file);
                    const fileStats = fs.statSync(filePath);
                    
                    if (fileStats.mtime < cutoffDate) {
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                });
                
                this.info(`Cleared ${deletedCount} old log files`);
                return deletedCount;
            }
            
            return 0;
        } catch (error) {
            this.error('Failed to clear old logs', { error: error.message });
            return 0;
        }
    }
}

module.exports = new Logger();