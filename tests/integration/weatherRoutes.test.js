const request = require('supertest');
const express = require('express');

jest.mock('../../middlewares/AuthMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user', tenant_id: 'tenant-1' };
    next();
  },
}));

// Mock WeatherService to avoid external call
jest.mock('../../services/weatherService', () => ({
  fetchCurrentWeather: jest.fn().mockResolvedValue({
    provider: 'open-meteo',
    fetchedAt: '2024-01-01T00:00:00Z',
    location: { latitude: 10, longitude: 106, timezone: 'Asia/Ho_Chi_Minh' },
    current: { temperature: 30, windspeed: 10, weathercode: 1 },
  }),
}));

const weatherRoutes = require('../../routes/weatherRoutes');
const WeatherService = require('../../services/weatherService');

describe('GET /integrations/weather/current', () => {
  const app = express();
  app.use('/api/integrations/weather', weatherRoutes);

  it('returns weather data', async () => {
    const res = await request(app).get('/api/integrations/weather/current');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBe('open-meteo');
    expect(WeatherService.fetchCurrentWeather).toHaveBeenCalled();
  });
});

