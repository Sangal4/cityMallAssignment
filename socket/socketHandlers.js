import logger from '../utils/logger.js';
import socialMediaService from '../services/socialMediaService.js';

function initializeSocketHandlers(io) {
    io.on('connection', (socket) => {
        logger.info(`Client connected: ${socket.id}`);

        // Join rooms for disaster/resource/social media updates
        socket.on('join', (room) => {
            socket.join(room);
            logger.info(`Client ${socket.id} joined room: ${room}`);
        });

        // Leave room
        socket.on('leave', (room) => {
            socket.leave(room);
            logger.info(`Client ${socket.id} left room: ${room}`);
        });

        // Monitor specific disaster
        socket.on('monitor_disaster', async (disasterId) => {
            try {
                // Join disaster-specific room
                socket.join(`disaster_${disasterId}`);
                
                // Initial data fetch
                const reports = await socialMediaService.getSocialMediaReports(disasterId);
                socket.emit('social_media_updated', { disasterId, reports });

                // Set up periodic updates
                const updateInterval = setInterval(async () => {
                    try {
                        const newReports = await socialMediaService.getSocialMediaReports(disasterId);
                        io.to(`disaster_${disasterId}`).emit('social_media_updated', {
                            disasterId,
                            reports: newReports
                        });
                    } catch (error) {
                        logger.error(`Error fetching social media updates: ${error.message}`);
                    }
                }, 30000); // Update every 30 seconds

                // Clean up on disconnect or when stopping monitoring
                socket.on('stop_monitoring', () => {
                    clearInterval(updateInterval);
                    socket.leave(`disaster_${disasterId}`);
                });

                socket.on('disconnect', () => {
                    clearInterval(updateInterval);
                });
            } catch (error) {
                logger.error(`Error in monitor_disaster: ${error.message}`);
                socket.emit('error', { message: 'Failed to start monitoring' });
            }
        });

        // Handle priority alerts
        socket.on('priority_alert', async (data) => {
            try {
                const { disasterId, alert } = data;
                // Broadcast to all clients monitoring this disaster
                io.to(`disaster_${disasterId}`).emit('new_priority_alert', alert);
                logger.info(`Priority alert broadcast for disaster ${disasterId}`);
            } catch (error) {
                logger.error(`Error in priority_alert: ${error.message}`);
            }
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });
}

export { initializeSocketHandlers }; 