# Disaster Response Platform

A comprehensive real-time disaster response coordination platform built with Node.js, React, and Supabase.

## Features

- Real-time disaster event tracking and management
- Resource allocation and management system
- Social media monitoring for disaster-related information
- Geolocation-based disaster mapping
- Real-time updates and notifications via WebSocket
- User authentication and role-based access control
- Automated verification system for disaster reports

## Tech Stack

### Backend
- Node.js
- Express.js
- Socket.IO
- Supabase
- Winston (Logging)
- Jest (Testing)

### Frontend
- React
- Vite
- Socket.IO Client
- React Router
- Modern CSS

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Supabase account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Sangal4/cityMallAssignment.git
cd cityMallAssignment
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Create environment files:

Backend (.env):
```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Frontend (.env):
```env
VITE_API_URL=http://localhost:5000/api
VITE_WEBSOCKET_URL=ws://localhost:5000
```

## Development

1. Start the backend server:
```bash
# In the root directory
npm run dev
```

2. Start the frontend development server:
```bash
# In the frontend directory
npm run dev
```

## Testing

Run backend tests:
```bash
npm test
```

Run real-time functionality tests:
```bash
npm run test:realtime
```

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - VITE_API_URL
   - VITE_WEBSOCKET_URL
4. Deploy

### Backend (Render)

1. Push code to GitHub
2. Create new Web Service in Render
3. Connect repository
4. Configure environment variables
5. Deploy

## Project Structure

```
├── config/             # Configuration files
├── controllers/        # Route controllers
├── frontend/          # React frontend application
├── middleware/        # Express middleware
├── routes/            # API routes
├── services/          # Business logic
├── socket/            # WebSocket handlers
├── utils/             # Utility functions
└── server.js          # Main application file
```

## API Documentation

### Endpoints

- `GET /api/disasters` - Get all disasters
- `POST /api/disasters` - Create new disaster
- `GET /api/resources` - Get available resources
- `POST /api/resources` - Add new resource
- `GET /api/social-media` - Get social media updates
- More endpoints documented in the code

### WebSocket Events

- `disaster:update` - Real-time disaster updates
- `resource:update` - Resource allocation updates
- `verification:status` - Verification status changes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Project Link: [https://github.com/Sangal4/cityMallAssignment](https://github.com/Sangal4/cityMallAssignment)
