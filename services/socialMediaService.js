import axios from 'axios';
import logger from '../utils/logger.js';
import cache from '../utils/cache.js';

class SocialMediaService {
    constructor() {
        this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
        this.twitterBaseURL = 'https://api.twitter.com/2';
        this.blueskyIdentifier = process.env.BLUESKY_IDENTIFIER;
        this.blueskyPassword = process.env.BLUESKY_PASSWORD;

        if (!this.twitterBearerToken) {
            logger.warn('Twitter API credentials not found. Using mock data.');
        }
    }

    async getSocialMediaReports(disasterId, keywords = []) {
        const cacheKey = cache.generateKey('social_media', disasterId, keywords.join(','));
        const cached = await cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Try Twitter API first
            if (this.twitterBearerToken) {
                const twitterData = await this.getTwitterReports(keywords);
                if (twitterData && twitterData.length > 0) {
                    const result = this.processSocialMediaData(twitterData, 'twitter');
                    await cache.set(cacheKey, result);
                    return result;
                }
            }

            // Fallback to mock data
            const mockData = await this.getMockSocialMediaReports(disasterId, keywords);
            const result = this.processSocialMediaData(mockData, 'mock');
            await cache.set(cacheKey, result);
            return result;
        } catch (error) {
            logger.error('Social media reports error:', error.message);
            return this.getMockSocialMediaReports(disasterId, keywords);
        }
    }

    async getTwitterReports(keywords) {
        try {
            const query = keywords.length > 0
                ? keywords.map(k => `"${k}"`).join(' OR ')
                : 'disaster OR emergency OR flood OR earthquake OR fire';

            const response = await axios.get(`${this.twitterBaseURL}/tweets/search/recent`, {
                headers: {
                    'Authorization': `Bearer ${this.twitterBearerToken}`
                },
                params: {
                    query,
                    max_results: 20,
                    'tweet.fields': 'created_at,author_id,text',
                    'user.fields': 'username,name'
                }
            });

            if (response.data && response.data.data) {
                logger.apiCall('Twitter', 'search', 'success');
                return response.data.data;
            }

            logger.apiCall('Twitter', 'search', 'no_results');
            return [];
        } catch (error) {
            logger.error('Twitter API error:', error.message);
            logger.apiCall('Twitter', 'search', 'error');
            return [];
        }
    }

    async getMockSocialMediaReports(disasterId, keywords) {
        // Generate mock social media reports based on disaster type and keywords
        const mockReports = [
            {
                id: `mock_${disasterId}_1`,
                text: `#floodrelief Need food and water in Lower East Side, NYC. Situation is urgent!`,
                author_id: 'citizen1',
                username: 'citizen1',
                name: 'Local Resident',
                created_at: new Date().toISOString(),
                priority: 'high',
                type: 'need'
            },
            {
                id: `mock_${disasterId}_2`,
                text: `Red Cross shelter open at 123 Main St. Providing food, water, and medical assistance. #disasterresponse`,
                author_id: 'redcross_nyc',
                username: 'redcross_nyc',
                name: 'Red Cross NYC',
                created_at: new Date(Date.now() - 3600000).toISOString(),
                priority: 'medium',
                type: 'offer'
            },
            {
                id: `mock_${disasterId}_3`,
                text: `SOS! Trapped in building on 5th Ave. Need immediate rescue. #emergency #flood`,
                author_id: 'trapped_citizen',
                username: 'trapped_citizen',
                name: 'Emergency Call',
                created_at: new Date(Date.now() - 1800000).toISOString(),
                priority: 'critical',
                type: 'alert'
            },
            {
                id: `mock_${disasterId}_4`,
                text: `Volunteers needed at Central Park shelter. Helping with distribution and medical support. #volunteer`,
                author_id: 'volunteer_coord',
                username: 'volunteer_coord',
                name: 'Volunteer Coordinator',
                created_at: new Date(Date.now() - 7200000).toISOString(),
                priority: 'medium',
                type: 'request'
            },
            {
                id: `mock_${disasterId}_5`,
                text: `Power restored in Midtown area. Traffic lights working again. #recovery`,
                author_id: 'nyc_utilities',
                username: 'nyc_utilities',
                name: 'NYC Utilities',
                created_at: new Date(Date.now() - 5400000).toISOString(),
                priority: 'low',
                type: 'update'
            }
        ];

        // Filter by keywords if provided
        if (keywords.length > 0) {
            return mockReports.filter(report =>
                keywords.some(keyword =>
                    report.text.toLowerCase().includes(keyword.toLowerCase())
                )
            );
        }

        return mockReports;
    }

    processSocialMediaData(rawData, source) {
        return rawData.map(item => ({
            id: item.id,
            text: item.text || item.content,
            username: item.username || item.user?.username,
            name: item.name || item.user?.name,
            created_at: item.created_at || item.timestamp,
            priority: item.priority || this.analyzePriority(item.text || item.content),
            type: item.type || this.classifyReportType(item.text || item.content)
        }));
    }

    analyzePriority(content) {
        const criticalKeywords = ['SOS', 'urgent', 'immediate', 'trapped', 'emergency'];
        const highKeywords = ['need', 'help', 'assistance', 'critical'];
        const mediumKeywords = ['volunteer', 'shelter', 'food', 'water'];

        const lowerContent = content.toLowerCase();

        if (criticalKeywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))) {
            return 'critical';
        } else if (highKeywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))) {
            return 'high';
        } else if (mediumKeywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))) {
            return 'medium';
        }

        return 'low';
    }

    classifyReportType(content) {
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('need') || lowerContent.includes('help')) {
            return 'need';
        } else if (lowerContent.includes('shelter') || lowerContent.includes('food') || lowerContent.includes('water')) {
            return 'offer';
        } else if (lowerContent.includes('SOS') || lowerContent.includes('emergency')) {
            return 'alert';
        } else if (lowerContent.includes('volunteer') || lowerContent.includes('assist')) {
            return 'request';
        } else if (lowerContent.includes('restored') || lowerContent.includes('recovery')) {
            return 'update';
        }

        return 'general';
    }

    extractKeywords(content) {
        const keywords = [];
        const commonKeywords = ['flood', 'earthquake', 'fire', 'shelter', 'food', 'water', 'medical', 'rescue', 'volunteer'];

        commonKeywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
                keywords.push(keyword);
            }
        });

        return keywords;
    }

    async getPriorityAlerts(disasterId) {
        const reports = await this.getSocialMediaReports(disasterId);
        return reports.filter(report =>
            report.priority === 'critical' || report.priority === 'high'
        );
    }
}

const socialMediaService = new SocialMediaService();
export default socialMediaService; 