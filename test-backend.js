const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const TEST_USER = 'netrunnerX';

async function testBackend() {
    console.log('🧪 Testing Disaster Response Platform Backend...\n');

    try {
        // Test health endpoint
        console.log('1. Testing health endpoint...');
        const health = await axios.get('http://localhost:5000/health');
        console.log('✅ Health check passed:', health.data.status);

        // Test disaster creation
        console.log('\n2. Testing disaster creation...');
        const disasterData = {
            title: 'Test Disaster',
            description: 'Heavy flooding in Manhattan, NYC affecting Lower East Side',
            tags: ['flood', 'test']
        };

        const disaster = await axios.post(`${API_BASE}/disasters`, disasterData, {
            headers: { 'x-username': TEST_USER }
        });
        console.log('✅ Disaster created:', disaster.data.disaster.title);

        // Test geocoding
        console.log('\n3. Testing geocoding...');
        const geocode = await axios.post(`${API_BASE}/geocode`, {
            description: 'Heavy flooding in Manhattan, NYC'
        });
        console.log('✅ Geocoding result:', geocode.data.location_name);

        // Test social media mock
        console.log('\n4. Testing social media mock...');
        const socialMedia = await axios.get(`${API_BASE}/social-media/mock?disaster_id=${disaster.data.disaster.id}`);
        console.log('✅ Social media reports:', socialMedia.data.reports.length, 'reports');

        // Test resource creation
        console.log('\n5. Testing resource creation...');
        const resourceData = {
            disaster_id: disaster.data.disaster.id,
            name: 'Test Shelter',
            location_name: 'Lower East Side, NYC',
            type: 'shelter'
        };

        const resource = await axios.post(`${API_BASE}/resources`, resourceData, {
            headers: { 'x-username': TEST_USER }
        });
        console.log('✅ Resource created:', resource.data.resource.name);

        // Test image verification (mock)
        console.log('\n6. Testing image verification...');
        const verification = await axios.post(`${API_BASE}/verification/${disaster.data.disaster.id}/verify-image`, {
            image_url: 'https://example.com/test-image.jpg'
        });
        console.log('✅ Image verification result:', verification.data.verification.verified ? 'Verified' : 'Not verified');

        // Test official updates
        console.log('\n7. Testing official updates...');
        const updates = await axios.get(`${API_BASE}/updates/${disaster.data.disaster.id}/official-updates`);
        console.log('✅ Official updates fetched:', updates.data.updates.length, 'updates');

        // Test disaster retrieval
        console.log('\n8. Testing disaster retrieval...');
        const disasters = await axios.get(`${API_BASE}/disasters`);
        console.log('✅ Disasters retrieved:', disasters.data.disasters.length, 'disasters');

        // Test resource geospatial search
        console.log('\n9. Testing geospatial resource search...');
        const resources = await axios.get(`${API_BASE}/resources?lat=40.7128&lon=-74.0060&radius=10`);
        console.log('✅ Resources found:', resources.data.resources.length, 'resources');

        console.log('\n🎉 All backend tests passed!');
        console.log('\n📋 Test Summary:');
        console.log('- Health check: ✅');
        console.log('- Disaster CRUD: ✅');
        console.log('- Geocoding: ✅');
        console.log('- Social media: ✅');
        console.log('- Resource management: ✅');
        console.log('- Image verification: ✅');
        console.log('- Official updates: ✅');
        console.log('- Geospatial queries: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.error || error.message);
        console.log('\n💡 Make sure the backend server is running on port 5000');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testBackend();
}

module.exports = { testBackend }; 