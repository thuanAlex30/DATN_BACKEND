const PPERepository = require('../repository/PPERepository');

/**
 * Weather code mapping (WMO Weather interpretation codes)
 * https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 */
const WEATHER_CODES = {
  CLEAR: [0, 1],
  CLOUDY: [2, 3],
  FOG: [45, 48],
  DRIZZLE: [51, 53, 55, 56, 57],
  RAIN: [61, 63, 65, 66, 67, 80, 81, 82],
  SNOW: [71, 73, 75, 77, 85, 86],
  THUNDERSTORM: [95, 96, 99],
};

/**
 * Map weather conditions to suggested PPE categories
 */
const WEATHER_TO_PPE_MAPPING = {
  // Rain conditions - need waterproof gear
  RAIN: {
    categories: ['Áo mưa', 'Quần mưa', 'Ủng chống nước', 'Mũ bảo hiểm chống nước'],
    keywords: ['mưa', 'waterproof', 'chống nước', 'rain', 'áo mưa', 'ủng']
  },
  // High wind - need secure headgear
  WIND: {
    categories: ['Mũ bảo hiểm', 'Kính bảo hộ', 'Khẩu trang'],
    keywords: ['mũ', 'helmet', 'kính', 'goggles', 'khẩu trang', 'mask']
  },
  // Hot weather - need sun protection
  HOT: {
    categories: ['Mũ nón', 'Kính mắt', 'Kem chống nắng', 'Áo chống nắng'],
    keywords: ['mũ', 'nón', 'kính', 'sunglasses', 'chống nắng', 'sun']
  },
  // Cold weather - need warm gear
  COLD: {
    categories: ['Áo ấm', 'Găng tay', 'Mũ len', 'Khăn quàng'],
    keywords: ['ấm', 'warm', 'găng', 'gloves', 'mũ len', 'khăn']
  },
  // Fog/low visibility - need high visibility gear
  LOW_VISIBILITY: {
    categories: ['Áo phản quang', 'Đèn pin', 'Kính bảo hộ'],
    keywords: ['phản quang', 'reflective', 'đèn', 'light', 'high visibility']
  },
  // Thunderstorm - need electrical safety
  THUNDERSTORM: {
    categories: ['Giày cách điện', 'Găng tay cách điện', 'Áo mưa'],
    keywords: ['cách điện', 'insulated', 'electrical', 'mưa']
  }
};

class EquipmentSuggestionService {
  /**
   * Get weather condition type from weather code and temperature
   */
  static getWeatherCondition(weatherCode, temperature, windSpeed) {
    const conditions = [];

    // Check for rain
    if (WEATHER_CODES.RAIN.includes(weatherCode) || 
        WEATHER_CODES.DRIZZLE.includes(weatherCode)) {
      conditions.push('RAIN');
    }

    // Check for thunderstorm
    if (WEATHER_CODES.THUNDERSTORM.includes(weatherCode)) {
      conditions.push('THUNDERSTORM');
    }

    // Check for fog/low visibility
    if (WEATHER_CODES.FOG.includes(weatherCode)) {
      conditions.push('LOW_VISIBILITY');
    }

    // Check temperature conditions (assuming Celsius)
    if (temperature >= 30) {
      conditions.push('HOT');
    } else if (temperature <= 15) {
      conditions.push('COLD');
    }

    // Check wind conditions (km/h)
    if (windSpeed >= 25) {
      conditions.push('WIND');
    }

    return conditions;
  }

  /**
   * Suggest PPE items based on weather conditions
   */
  static async suggestEquipment(weatherData, tenantId = null) {
    try {
      const { current } = weatherData;
      if (!current) {
        return { suggestions: [], message: 'No weather data available' };
      }

      const weatherCode = current.weathercode || 0;
      const temperature = current.temperature || 20;
      const windSpeed = current.windspeed || 0;

      // Get weather conditions
      const conditions = this.getWeatherCondition(weatherCode, temperature, windSpeed);

      // Get all PPE items for the tenant
      const allItems = await PPERepository.getAllItems({}, tenantId);

      // Collect suggested categories and keywords
      const suggestedCategories = new Set();
      const suggestedKeywords = new Set();

      conditions.forEach(condition => {
        const mapping = WEATHER_TO_PPE_MAPPING[condition];
        if (mapping) {
          mapping.categories.forEach(cat => suggestedCategories.add(cat));
          mapping.keywords.forEach(kw => suggestedKeywords.add(kw.toLowerCase()));
        }
      });

      // Filter PPE items that match suggested categories or keywords
      const suggestions = allItems
        .filter(item => {
          const categoryName = item.category?.category_name?.toLowerCase() || '';
          const itemName = item.item_name?.toLowerCase() || '';
          const itemCode = item.item_code?.toLowerCase() || '';

          // Check if item matches any suggested category
          const matchesCategory = Array.from(suggestedCategories).some(cat =>
            categoryName.includes(cat.toLowerCase())
          );

          // Check if item matches any suggested keyword
          const matchesKeyword = Array.from(suggestedKeywords).some(kw =>
            itemName.includes(kw) || itemCode.includes(kw)
          );

          return matchesCategory || matchesKeyword;
        })
        .map(item => ({
          id: item._id?.toString() || item.id,
          item_code: item.item_code,
          item_name: item.item_name,
          category: item.category?.category_name || 'Unknown',
          reason: this.getSuggestionReason(item, conditions),
          priority: this.getPriority(item, conditions),
          quantity_available: item.quantity_available || 0,
        }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10); // Limit to top 10 suggestions

      // Generate human-readable message
      const conditionMessages = conditions.map(cond => {
        switch(cond) {
          case 'RAIN': return 'mưa';
          case 'HOT': return 'nắng nóng';
          case 'COLD': return 'lạnh';
          case 'WIND': return 'gió mạnh';
          case 'LOW_VISIBILITY': return 'tầm nhìn thấp';
          case 'THUNDERSTORM': return 'dông bão';
          default: return '';
        }
      }).filter(Boolean);

      const message = conditionMessages.length > 0
        ? `Thời tiết hôm nay có ${conditionMessages.join(', ')}. Nên mang các thiết bị bảo hộ phù hợp.`
        : 'Thời tiết bình thường. Mang các thiết bị bảo hộ tiêu chuẩn.';

      return {
        suggestions,
        conditions,
        message,
        weather: {
          temperature: temperature.toFixed(1),
          windSpeed: windSpeed.toFixed(1),
          weatherCode,
        }
      };
    } catch (error) {
      console.error('Error suggesting equipment:', error);
      throw {
        statusCode: 500,
        message: 'Failed to suggest equipment',
        error: error.message
      };
    }
  }

  /**
   * Get reason why this item is suggested
   */
  static getSuggestionReason(item, conditions) {
    const reasons = [];
    const itemName = item.item_name?.toLowerCase() || '';
    const categoryName = item.category?.category_name?.toLowerCase() || '';

    if (conditions.includes('RAIN') && (itemName.includes('mưa') || itemName.includes('nước'))) {
      reasons.push('Chống mưa');
    }
    if (conditions.includes('HOT') && (itemName.includes('nắng') || itemName.includes('nón'))) {
      reasons.push('Chống nắng');
    }
    if (conditions.includes('COLD') && (itemName.includes('ấm') || itemName.includes('len'))) {
      reasons.push('Giữ ấm');
    }
    if (conditions.includes('WIND') && (itemName.includes('mũ') || itemName.includes('kính'))) {
      reasons.push('Bảo vệ khỏi gió');
    }
    if (conditions.includes('LOW_VISIBILITY') && (itemName.includes('phản quang') || itemName.includes('sáng'))) {
      reasons.push('Tăng tầm nhìn');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Phù hợp với điều kiện thời tiết';
  }

  /**
   * Get priority score for suggestion (higher = more important)
   */
  static getPriority(item, conditions) {
    let priority = 1;
    const itemName = item.item_name?.toLowerCase() || '';

    // Higher priority for critical conditions
    if (conditions.includes('THUNDERSTORM')) priority += 3;
    if (conditions.includes('RAIN')) priority += 2;
    if (conditions.includes('WIND')) priority += 2;
    if (conditions.includes('LOW_VISIBILITY')) priority += 2;
    if (conditions.includes('HOT') || conditions.includes('COLD')) priority += 1;

    // Higher priority for essential safety items
    if (itemName.includes('mũ bảo hiểm') || itemName.includes('helmet')) priority += 2;
    if (itemName.includes('giày') || itemName.includes('boots')) priority += 1;

    return priority;
  }
}

module.exports = EquipmentSuggestionService;

