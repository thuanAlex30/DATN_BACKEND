const axios = require('axios');
const WeatherService = require('../services/weatherService');

jest.mock('axios');

describe('WeatherService', () => {
  const mockResponse = {
    data: {
      latitude: 10,
      longitude: 106,
      elevation: 5,
      timezone: 'Asia/Ho_Chi_Minh',
      utc_offset_seconds: 25200,
      current_weather: {
        temperature: 30,
        windspeed: 10,
        weathercode: 1,
      },
    },
  };

  beforeEach(() => {
    axios.get.mockReset();
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns weather data and caches it', async () => {
    axios.get.mockResolvedValueOnce(mockResponse);

    const result1 = await WeatherService.fetchCurrentWeather({});
    const result2 = await WeatherService.fetchCurrentWeather({});

    expect(result1.current.temperature).toBe(30);
    expect(result2.current.temperature).toBe(30);
    expect(axios.get).toHaveBeenCalledTimes(1); // second call served from cache
    expect(result1.stale).toBe(false);
  });

  it('returns stale cache when provider fails', async () => {
    axios.get.mockResolvedValueOnce(mockResponse);
    await WeatherService.fetchCurrentWeather({});

    axios.get.mockRejectedValueOnce(new Error('provider down'));
    const result = await WeatherService.fetchCurrentWeather({});

    expect(result.stale).toBe(true);
    expect(result.current.temperature).toBe(30);
  });
});

