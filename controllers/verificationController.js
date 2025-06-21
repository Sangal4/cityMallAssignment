import geminiService from '../services/geminiService.js';
import logger from '../utils/logger.js';

// Verify information using AI
export const verifyInformation = async (req, res) => {
    try {
        const { text, context } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text to verify is required' });
        }

        const verificationResult = await geminiService.verifyInformation(text, context);
        res.json({ verification: verificationResult });
    } catch (error) {
        logger.error('Verification error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 