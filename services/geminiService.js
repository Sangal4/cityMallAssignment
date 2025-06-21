import axios from 'axios';
import logger from '../utils/logger.js';
import cache from '../utils/cache.js';

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro';
        this.visionURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision';

        if (!this.apiKey) {
            logger.warn('Gemini API key not found. Some features will be limited.');
        }
    }

    async extractLocation(description) {
        if (!this.apiKey) {
            logger.warn('Gemini API key not available for location extraction');
            return this.fallbackLocationExtraction(description);
        }

        const cacheKey = cache.generateKey('gemini', 'location', description);
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const prompt = `Extract the location name from the following disaster description. Return only the location name in a simple format like "City, State" or "City, Country". If no specific location is mentioned, return "Unknown location".

Description: ${description}

Location:`;

            const response = await axios.post(`${this.baseURL}:generateContent?key=${this.apiKey}`, {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            });

            const location = response.data.candidates[0].content.parts[0].text.trim();

            logger.apiCall('Gemini', 'location_extraction', 'success');
            await cache.set(cacheKey, location);

            return location;
        } catch (error) {
            logger.error('Gemini location extraction error:', error.message);
            logger.apiCall('Gemini', 'location_extraction', 'error');
            return this.fallbackLocationExtraction(description);
        }
    }

    async verifyImage(imageUrl) {
        if (!this.apiKey) {
            logger.warn('Gemini API key not available for image verification');
            return { verified: false, confidence: 0, reason: 'API key not available' };
        }

        const cacheKey = cache.generateKey('gemini', 'image_verification', imageUrl);
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const prompt = `Analyze this image for signs of disaster context and potential manipulation. Look for:
1. Signs of natural disasters (flooding, fire, earthquake damage, etc.)
2. Evidence of image manipulation or editing
3. Context that suggests this is a real disaster scene

Return a JSON response with:
- verified: boolean (true if image appears to show real disaster context)
- confidence: number (0-1, confidence in the assessment)
- reason: string (explanation of the assessment)
- manipulation_detected: boolean (true if signs of editing detected)`;

            const response = await axios.post(`${this.visionURL}:generateContent?key=${this.apiKey}`, {
                contents: [{
                    parts: [
                        {
                            text: prompt
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: await this.getImageAsBase64(imageUrl)
                            }
                        }
                    ]
                }]
            });

            const result = response.data.candidates[0].content.parts[0].text.trim();

            // Try to parse JSON response
            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            } catch (parseError) {
                // If JSON parsing fails, create a basic response
                parsedResult = {
                    verified: result.toLowerCase().includes('real') || result.toLowerCase().includes('authentic'),
                    confidence: 0.5,
                    reason: result,
                    manipulation_detected: result.toLowerCase().includes('manipulation') || result.toLowerCase().includes('edited')
                };
            }

            logger.apiCall('Gemini', 'image_verification', 'success');
            await cache.set(cacheKey, parsedResult);

            return parsedResult;
        } catch (error) {
            logger.error('Gemini image verification error:', error.message);
            logger.apiCall('Gemini', 'image_verification', 'error');
            return { verified: false, confidence: 0, reason: 'Verification failed' };
        }
    }

    async getImageAsBase64(imageUrl) {
        try {
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer'
            });
            return Buffer.from(response.data, 'binary').toString('base64');
        } catch (error) {
            logger.error('Error fetching image for verification:', error.message);
            throw new Error('Failed to fetch image');
        }
    }

    fallbackLocationExtraction(description) {
        // Simple fallback location extraction using common patterns
        const locationPatterns = [
            /(?:in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/g,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)/g
        ];

        for (const pattern of locationPatterns) {
            const match = description.match(pattern);
            if (match) {
                return match[1] || 'Unknown location';
            }
        }

        return 'Unknown location';
    }
}

const geminiService = new GeminiService();
export default geminiService; 