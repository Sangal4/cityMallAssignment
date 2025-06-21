import { useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Generate a random test user name
const generateTestUser = () => {
    const prefixes = ['Emergency', 'Rescue', 'Response', 'Field', 'Support'];
    const roles = ['Worker', 'Team', 'Unit', 'Coordinator', 'Reporter'];
    const number = Math.floor(Math.random() * 1000);
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    return {
        username: `${prefix.toLowerCase()}${role.toLowerCase()}${number}`,
        name: `${prefix} ${role} ${number}`
    };
};

function TestPanel({ disasterId }) {
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('medium');
    const [status, setStatus] = useState('');
    const [sending, setSending] = useState(false);

    const sendTestAlert = () => {
        if (!disasterId || !message) {
            setStatus('Please select a disaster and enter a message');
            return;
        }

        setSending(true);
        setStatus('Connecting...');

        const socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000
        });
        
        socket.on('connect', () => {
            setStatus('Connected, sending alert...');
            
            // Generate test user info
            const testUser = generateTestUser();
            
            // Send test alert
            socket.emit('priority_alert', {
                disasterId,
                alert: {
                    id: `test_${Date.now()}`,
                    text: message,
                    priority: priority,
                    created_at: new Date().toISOString(),
                    username: testUser.username,
                    name: testUser.name,
                    type: priority === 'critical' ? 'alert' : 
                          priority === 'high' ? 'need' :
                          priority === 'medium' ? 'update' : 'info'
                }
            });

            setStatus('Test alert sent successfully!');
            setMessage('');
            setSending(false);

            // Disconnect after sending
            setTimeout(() => {
                socket.disconnect();
            }, 1000);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setStatus('Failed to connect to server. Please check if the server is running.');
            setSending(false);
        });

        socket.on('error', (error) => {
            setStatus(`Error: ${error.message}`);
            setSending(false);
        });

        // Timeout if connection takes too long
        setTimeout(() => {
            if (!socket.connected) {
                socket.disconnect();
                setStatus('Connection timeout. Please try again.');
                setSending(false);
            }
        }, 5000);
    };

    return (
        <div className="test-panel">
            <h3>Test Panel</h3>
            <div className="test-controls">
                <div className="input-group">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter test message..."
                        rows={3}
                    />
                </div>
                <div className="input-group">
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <option value="low">Low Priority (Info)</option>
                        <option value="medium">Medium Priority (Update)</option>
                        <option value="high">High Priority (Need)</option>
                        <option value="critical">Critical Priority (Alert)</option>
                    </select>
                </div>
                <button 
                    onClick={sendTestAlert}
                    disabled={!disasterId || !message || sending}
                >
                    {sending ? 'Sending...' : 'Send Test Alert'}
                </button>
            </div>
            {status && (
                <div className={`status-message ${
                    status.includes('Error') || status.includes('Failed') ? 'error' : 
                    status.includes('Connected') || status.includes('Connecting') ? 'info' : 
                    'success'
                }`}>
                    {status}
                </div>
            )}
        </div>
    );
}

export default TestPanel; 