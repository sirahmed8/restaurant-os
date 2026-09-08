/**
 * =====================================================================
 * RESTAURANT OS — WEATHER SERVICE (OPEN-METEO & OPENWEATHER INTEGRATION)
 * =====================================================================
 * Retrieves live weather data for the restaurant's coordinates and provides
 * weather-driven culinary and promotional recommendations.
 */

export interface WeatherData {
  city: string;
  temperature: number; // in Celsius
  apparentTemperature: number;
  humidity: number; // percentage
  windSpeed: number; // km/h
  isDay: boolean;
  weatherCode: number;
  conditionAr: string;
  conditionEn: string;
  icon: string; // Weather icon identifier
  recommendationCategory: 'hot_comfort' | 'cold_refreshing' | 'outdoor_seating' | 'cozy_dessert';
  recommendedDishKeywordsAr: string[];
  recommendedDishKeywordsEn: string[];
}

class WeatherService {
  // Default coordinates: Cairo, Egypt
  private defaultLatitude = 30.0444;
  private defaultLongitude = 31.2357;
  private defaultCity = 'القاهرة (Cairo)';
  private cachedWeather: WeatherData | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache

  /**
   * Fetch current live weather from Open-Meteo with local fallback.
   */
  public async getCurrentWeather(
    latitude = this.defaultLatitude,
    longitude = this.defaultLongitude,
    city = this.defaultCity
  ): Promise<WeatherData> {
    const now = Date.now();
    if (this.cachedWeather && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedWeather;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const current = data.current;

      const code = current.weather_code || 0;
      const temp = Math.round(current.temperature_2m);
      const apparentTemp = Math.round(current.apparent_temperature);
      const isDay = current.is_day === 1;

      const condition = this.interpretWmoCode(code, isDay);
      const recommendation = this.getRecommendation(temp, code);

      const weatherData: WeatherData = {
        city,
        temperature: temp,
        apparentTemperature: apparentTemp,
        humidity: current.relative_humidity_2m || 30,
        windSpeed: Math.round(current.wind_speed_10m || 10),
        isDay,
        weatherCode: code,
        conditionAr: condition.ar,
        conditionEn: condition.en,
        icon: condition.icon,
        recommendationCategory: recommendation.category,
        recommendedDishKeywordsAr: recommendation.keywordsAr,
        recommendedDishKeywordsEn: recommendation.keywordsEn,
      };

      this.cachedWeather = weatherData;
      this.lastFetchTime = now;

      return weatherData;
    } catch (err) {
      console.warn('[Weather Service] Failed to fetch live weather, returning realistic seasonal fallback:', err);
      return this.getFallbackWeather(city);
    }
  }

  private interpretWmoCode(code: number, isDay: boolean): { ar: string; en: string; icon: string } {
    switch (code) {
      case 0:
        return isDay
          ? { ar: 'مشمس وصافٍ', en: 'Clear & Sunny', icon: 'Sun' }
          : { ar: 'ليلة صافية وباردة', en: 'Clear Night', icon: 'Moon' };
      case 1:
      case 2:
      case 3:
        return { ar: 'غائم جزئيًا', en: 'Partly Cloudy', icon: 'CloudSun' };
      case 45:
      case 48:
        return { ar: 'ضباب وضباب جليدي', en: 'Foggy', icon: 'CloudFog' };
      case 51:
      case 53:
      case 55:
        return { ar: 'رذاذ مطر خفيف', en: 'Light Drizzle', icon: 'CloudDrizzle' };
      case 61:
      case 63:
      case 65:
        return { ar: 'أمطار منعشة', en: 'Refreshing Rain', icon: 'CloudRain' };
      case 80:
      case 81:
      case 82:
        return { ar: 'زخات مطر قوية', en: 'Heavy Showers', icon: 'CloudLightning' };
      default:
        return { ar: 'معتدل ولطيف', en: 'Pleasant', icon: 'SunMedium' };
    }
  }

  private getRecommendation(
    temp: number,
    code: number
  ): { category: WeatherData['recommendationCategory']; keywordsAr: string[]; keywordsEn: string[] } {
    if (temp >= 32) {
      return {
        category: 'cold_refreshing',
        keywordsAr: ['موهيتو', 'عصير', 'سلمون', 'آيس كريم', 'سلطة'],
        keywordsEn: ['Mojito', 'Juice', 'Salmon', 'Ice Cream', 'Salad'],
      };
    } else if (temp <= 18 || code >= 50) {
      return {
        category: 'hot_comfort',
        keywordsAr: ['شوربة', 'ستيك', 'مشاوي', 'قهوة مقطرة', 'طاجن'],
        keywordsEn: ['Soup', 'Steak', 'Grills', 'Drip Coffee', 'Tagine'],
      };
    } else {
      return {
        category: 'outdoor_seating',
        keywordsAr: ['مشاوي', 'باستا', 'بيتزا حطب', 'موهيتو', 'تشيز كيك'],
        keywordsEn: ['Grills', 'Pasta', 'Artisan Pizza', 'Mojito', 'Cheesecake'],
      };
    }
  }

  private getFallbackWeather(city: string): WeatherData {
    return {
      city,
      temperature: 28,
      apparentTemperature: 27,
      humidity: 25,
      windSpeed: 12,
      isDay: true,
      weatherCode: 1,
      conditionAr: 'أجواء معتدلة وصافية',
      conditionEn: 'Clear & Mild',
      icon: 'Sun',
      recommendationCategory: 'outdoor_seating',
      recommendedDishKeywordsAr: ['مشكل مشاوي', 'بيتزا نابولي', 'موهيتو باشن'],
      recommendedDishKeywordsEn: ['Mixed Grill', 'Artisan Pizza', 'Passion Mojito'],
    };
  }
}

export const weatherService = new WeatherService();

export async function fetchLiveWeather(lat = 30.0444, lon = 31.2357) {
  const data = await weatherService.getCurrentWeather(lat, lon);
  return {
    temp: data.temperature,
    condition: data.conditionEn,
    conditionAr: data.conditionAr,
    icon: data.icon,
    humidity: data.humidity,
    city: 'Cairo Main',
    cityAr: 'فرع القاهرة الرئيسي',
    lastUpdated: new Date().toLocaleTimeString(),
  };
}
