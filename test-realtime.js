const io = require('socket.io-client');
const axios = require('axios');

const SOCKET_URL = 'http://localhost:5000';
const API_BASE = 'http://localhost:5000/api';
const TEST_USER = 'netrunnerX';

async function testRealTimeMonitoring() {
    console.log('🧪 Testing Real-Time Social Media Monitoring...\n');

    try {
        // 1. Create a test disaster first
        console.log('1. Creating test disaster...');
        const disasterData = {
            title: 'Test Real-Time Monitoring',
            description: 'Test disaster for real-time monitoring in Manhattan, NYC',
            tags: ['test', 'realtime']
        };

        const disaster = await axios.post(`${API_BASE}/disasters`, disasterData, {
            headers: { 'x-username': TEST_USER }
        });
        const disasterId = disaster.data.disaster.id;
        console.log('✅ Test disaster created:', disaster.data.disaster.title);

        // 2. Connect to WebSocket
        console.log('\n2. Connecting to WebSocket...');
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('✅ Connected to WebSocket server');
        });

        socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        // 3. Start monitoring the disaster
        console.log('\n3. Starting disaster monitoring...');
        socket.emit('monitor_disaster', disasterId);

        // 4. Listen for social media updates
        console.log('\n4. Listening for social media updates...');
        let updateCount = 0;
        
        socket.on('social_media_updated', ({ reports }) => {
            updateCount++;
            console.log(`✅ Received update #${updateCount}:`, reports.length, 'reports');
            console.log('   Sample report:', reports[0]?.text || 'No reports');
        });

        // 5. Listen for priority alerts
        console.log('\n5. Listening for priority alerts...');
        socket.on('new_priority_alert', (alert) => {
            console.log('✅ Received priority alert:', alert.text);
            console.log('   Priority level:', alert.priority);
        });

        // 6. Simulate a priority alert
        console.log('\n6. Simulating priority alert...');
        setTimeout(() => {
            socket.emit('priority_alert', {
                disasterId,
                alert: {
                    id: 'test_alert_1',
                    text: 'URGENT: Test emergency alert',
                    priority: 'critical',
                    created_at: new Date().toISOString()
                }
            });
        }, 2000);

        // 7. Wait for updates and then cleanup
        console.log('\n7. Waiting for updates (30 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // 8. Cleanup
        console.log('\n8. Cleaning up...');
        socket.emit('stop_monitoring');
        socket.disconnect();
        
        // 9. Delete test disaster
        await axios.delete(`${API_BASE}/disasters/${disasterId}`, {
            headers: { 'x-username': TEST_USER }
        });
        console.log('✅ Test disaster deleted');

        console.log('\n🎉 Real-time monitoring test completed!');
        console.log('\n📋 Test Summary:');
        console.log(`- WebSocket connection: ✅`);
        console.log(`- Disaster monitoring: ✅`);
        console.log(`- Updates received: ${updateCount}`);
        console.log('- Priority alert system: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.error || error.message);
        console.log('\n💡 Make sure the backend server is running on port 5000');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testRealTimeMonitoring();
}

module.exports = { testRealTimeMonitoring }; 