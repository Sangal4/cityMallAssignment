import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'disaster-response-platform' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Custom logging methods for structured disaster response logging
logger.disasterCreated = (disasterId, title, location) => {
    logger.info('Disaster created', {
        action: 'disaster_created',
        disaster_id: disasterId,
        title,
        location,
        timestamp: new Date().toISOString()
    });
};

logger.disasterUpdated = (disasterId, changes) => {
    logger.info('Disaster updated', {
        action: 'disaster_updated',
        disaster_id: disasterId,
        changes,
        timestamp: new Date().toISOString()
    });
};

logger.resourceMapped = (resourceName, location) => {
    logger.info('Resource mapped', {
        action: 'resource_mapped',
        resource_name: resourceName,
        location,
        timestamp: new Date().toISOString()
    });
};

logger.reportProcessed = (reportId, status) => {
    logger.info('Report processed', {
        action: 'report_processed',
        report_id: reportId,
        status,
        timestamp: new Date().toISOString()
    });
};

logger.apiCall = (service, endpoint, status) => {
    logger.info('API call made', {
        action: 'api_call',
        service,
        endpoint,
        status,
        timestamp: new Date().toISOString()
    });
};

logger.cacheHit = (key) => {
    logger.debug('Cache hit', {
        action: 'cache_hit',
        cache_key: key,
        timestamp: new Date().toISOString()
    });
};

logger.cacheMiss = (key) => {
    logger.debug('Cache miss', {
        action: 'cache_miss',
        cache_key: key,
        timestamp: new Date().toISOString()
    });
};

export default logger; 