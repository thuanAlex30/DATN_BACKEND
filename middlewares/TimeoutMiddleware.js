/**
 * Timeout Middleware
 * Adds timeout protection to API endpoints
 */

class TimeoutMiddleware {
    /**
     * Creates a timeout wrapper for async functions
     * @param {Function} fn - The async function to wrap
     * @param {number} timeoutMs - Timeout in milliseconds (default: 20000)
     * @returns {Function} - Wrapped function with timeout
     */
    static withTimeout(fn, timeoutMs = 20000) {
        return async (req, res, next) => {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
            });

            try {
                const resultPromise = fn(req, res, next);
                await Promise.race([resultPromise, timeoutPromise]);
            } catch (error) {
                if (error.message === 'Request timeout') {
                    return res.status(408).json({
                        success: false,
                        message: 'Yêu cầu quá thời gian chờ',
                        error: 'Timeout',
                        timestamp: new Date().toISOString()
                    });
                }
                throw error;
            }
        };
    }

    /**
     * Creates a timeout wrapper for database operations
     * @param {Function} operation - The database operation function
     * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
     * @returns {Promise} - Promise with timeout protection
     */
    static async withDatabaseTimeout(operation, timeoutMs = 15000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs);
        });

        try {
            const resultPromise = operation();
            return await Promise.race([resultPromise, timeoutPromise]);
        } catch (error) {
            if (error.message === 'Database operation timeout') {
                throw new Error('Thao tác cơ sở dữ liệu quá thời gian chờ');
            }
            throw error;
        }
    }

    /**
     * Creates a timeout wrapper for aggregation operations
     * @param {Function} aggregation - The aggregation operation function
     * @param {number} timeoutMs - Timeout in milliseconds (default: 25000)
     * @returns {Promise} - Promise with timeout protection
     */
    static async withAggregationTimeout(aggregation, timeoutMs = 25000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Aggregation operation timeout')), timeoutMs);
        });

        try {
            const resultPromise = aggregation();
            return await Promise.race([resultPromise, timeoutPromise]);
        } catch (error) {
            if (error.message === 'Aggregation operation timeout') {
                throw new Error('Thao tác phân tích dữ liệu quá thời gian chờ');
            }
            throw error;
        }
    }

    /**
     * Creates a timeout wrapper for parallel operations
     * @param {Array<Function>} operations - Array of operation functions
     * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
     * @returns {Promise} - Promise with timeout protection
     */
    static async withParallelTimeout(operations, timeoutMs = 30000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Parallel operations timeout')), timeoutMs);
        });

        try {
            const resultPromise = Promise.all(operations.map(op => op()));
            return await Promise.race([resultPromise, timeoutPromise]);
        } catch (error) {
            if (error.message === 'Parallel operations timeout') {
                throw new Error('Các thao tác song song quá thời gian chờ');
            }
            throw error;
        }
    }
}

module.exports = TimeoutMiddleware;
