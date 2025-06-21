import socialMediaService from '../services/socialMediaService.js';

export const getMockSocialMediaReports = async (req, res) => {
    const { disaster_id, keywords } = req.query;
    const reports = await socialMediaService.getMockSocialMediaReports(
        disaster_id || 'demo',
        keywords ? keywords.split(',') : []
    );
    res.json({ reports });
}; 