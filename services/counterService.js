const Counter = require('../models/counter');

class CounterService {
  /**
   * Get next sequence value for a counter
   * @param {string} counterName - Name of the counter
   * @returns {Promise<number>} - Next sequence value
   */
  static async getNextSequence(counterName) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      
      return counter.sequence_value;
    } catch (error) {
      console.error(`Error getting next sequence for ${counterName}:`, error);
      throw error;
    }
  }

  /**
   * Get current sequence value without incrementing
   * @param {string} counterName - Name of the counter
   * @returns {Promise<number>} - Current sequence value
   */
  static async getCurrentSequence(counterName) {
    try {
      const counter = await Counter.findOne({ name: counterName });
      return counter ? counter.sequence_value : 0;
    } catch (error) {
      console.error(`Error getting current sequence for ${counterName}:`, error);
      throw error;
    }
  }

  /**
   * Reset counter to a specific value
   * @param {string} counterName - Name of the counter
   * @param {number} value - Value to reset to
   * @returns {Promise<number>} - New sequence value
   */
  static async resetSequence(counterName, value = 0) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { sequence_value: value },
        { new: true, upsert: true }
      );
      
      return counter.sequence_value;
    } catch (error) {
      console.error(`Error resetting sequence for ${counterName}:`, error);
      throw error;
    }
  }
}

module.exports = CounterService;

