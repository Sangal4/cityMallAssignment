import { useState, useEffect } from "react";
import axios from "axios";
import TestPanel from "./TestPanel";
import { API_URL } from "../config/api";
import { createSocket } from "../config/socket";

function SocialMediaMonitor({ user }) {
  const [socket, setSocket] = useState(null);
  const [disasters, setDisasters] = useState([]);
  const [selectedDisaster, setSelectedDisaster] = useState("");
  const [socialMediaReports, setSocialMediaReports] = useState([]);
  const [officialUpdates, setOfficialUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = createSocket();

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to WebSocket server. Please check if the server is running.');
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to WebSocket after', attemptNumber, 'attempts');
      setConnected(true);
      setError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setError('Failed to reconnect to WebSocket server. Please check your connection.');
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError('WebSocket error occurred. Please try refreshing the page.');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Handle real-time updates
  useEffect(() => {
    if (!socket || !selectedDisaster) return;

    // Start monitoring the selected disaster
    socket.emit('monitor_disaster', selectedDisaster);

    // Listen for social media updates
    socket.on('social_media_updated', ({ reports }) => {
      setSocialMediaReports(prevReports => {
        // Merge new reports with existing ones, avoiding duplicates
        const existingIds = new Set(prevReports.map(r => r.id));
        const newReports = reports.filter(r => !existingIds.has(r.id));
        return [...newReports, ...prevReports]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      });
    });

    // Listen for priority alerts
    socket.on('new_priority_alert', (alert) => {
      setSocialMediaReports(prevReports => {
        if (alert.priority === 'critical' || alert.priority === 'high') {
          // Add visual or sound notification for high-priority alerts
          playAlertSound();
          showNotification(alert);
        }
        return [alert, ...prevReports];
      });
    });

    return () => {
      // Clean up socket listeners when component unmounts or disaster changes
      socket.emit('stop_monitoring');
      socket.off('social_media_updated');
      socket.off('new_priority_alert');
    };
  }, [socket, selectedDisaster]);

  useEffect(() => {
    fetchDisasters();
  }, []);

  useEffect(() => {
    if (selectedDisaster) {
      fetchSocialMediaReports();
      fetchOfficialUpdates();
    } else {
      setSocialMediaReports([]);
      setOfficialUpdates([]);
      setError(null);
    }
  }, [selectedDisaster]);

  const fetchDisasters = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/disasters`);
      setDisasters(response.data.disasters || []);
    } catch (error) {
      console.error('Error fetching disasters:', error);
      setError("Failed to fetch disasters.");
    }
  };

  const fetchSocialMediaReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_URL}/social-media?disaster_id=${selectedDisaster}`
      );
      setSocialMediaReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching social media reports:', error);
      setError("Failed to fetch social media reports.");
      setSocialMediaReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficialUpdates = async () => {
    setError(null);
    try {
      const response = await axios.get(
        `${API_URL}/disasters/${selectedDisaster}/updates`
      );
      // Transform updates to match expected format
      const formattedUpdates = (response.data.updates || []).map(update => ({
        id: update.id,
        text: update.content,
        type: update.type || 'official',
        priority: update.priority || 'medium',
        created_at: update.created_at,
        username: update.user_id,
        name: 'Official Update'
      }));
      setOfficialUpdates(formattedUpdates);
    } catch (error) {
      console.error('Error fetching updates:', error);
      setError("Failed to fetch official updates.");
      setOfficialUpdates([]);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "yellow";
      default:
        return "green";
    }
  };

  const playAlertSound = () => {
    // Implement alert sound for high-priority messages
    const audio = new Audio('/alert-sound.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const showNotification = (alert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Priority Alert', {
        body: alert.text,
        icon: '/alert-icon.png'
      });
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  const renderReportHeader = (report) => {
    const displayName = report.name || (report.username ? `@${report.username}` : 'Anonymous User');
    return (
      <div className="report-header">
        <strong>{displayName}</strong>
        <span className={`priority ${report.priority}`}>
          {report.priority?.toUpperCase()}
        </span>
      </div>
    );
  };

  const renderReportMeta = (report) => {
    return (
      <div className="report-meta">
        <span className="username">
          {report.username ? `@${report.username}` : 'anonymous'}
        </span>
        <span className="type">{report.type || 'general'}</span>
        <span className="timestamp">
          {report.created_at ? new Date(report.created_at).toLocaleString() : 'No timestamp'}
        </span>
      </div>
    );
  };

  return (
    <div className="social-media-monitor">
      <div className="monitor-header">
        <h2>Social Media & Official Updates Monitor</h2>
        <div className="connection-status">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Live' : '🔴 Offline'}
          </span>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>

      <div className="disaster-selector">
        <select
          value={selectedDisaster}
          onChange={(e) => setSelectedDisaster(e.target.value)}
          className="disaster-select"
        >
          <option value="">Select a Disaster</option>
          {disasters.map((disaster) => (
            <option key={disaster.id} value={disaster.id}>
              {disaster.title}
            </option>
          ))}
        </select>
      </div>

      {selectedDisaster ? (
        <>
          <div className="monitor-content">
            <div className="social-media-section">
              <div className="section-header">
                <h3>Social Media Reports</h3>
                <span className="report-count">
                  {socialMediaReports.length} reports
                </span>
              </div>
              
              {loading ? (
                <div className="loading-spinner">Loading reports...</div>
              ) : socialMediaReports.length === 0 ? (
                <div className="no-data">No social media reports found for this disaster.</div>
              ) : (
                <div className="reports-list">
                  {socialMediaReports.map((report) => (
                    <div
                      key={report.id}
                      className={`report-item ${report.priority}`}
                      style={{
                        borderLeft: `4px solid ${getPriorityColor(report.priority)}`,
                        animation: report.priority === 'critical' ? 'highlight 2s infinite' : 'none'
                      }}
                    >
                      {renderReportHeader(report)}
                      <p className="report-content">{report.text}</p>
                      {renderReportMeta(report)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="official-updates-section">
              <div className="section-header">
                <h3>Official Updates</h3>
                <span className="update-count">
                  {officialUpdates.length} updates
                </span>
              </div>
              
              <div className="updates-list">
                {officialUpdates.length === 0 ? (
                  <div className="no-data">No official updates available for this disaster.</div>
                ) : (
                  officialUpdates.map((update, index) => (
                    <div key={index} className="update-item">
                      <div className="update-header">
                        <strong>{update.name}</strong>
                        <span className="timestamp">
                          {new Date(update.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="update-content">{update.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Test Panel for simulating real-time updates */}
          <TestPanel disasterId={selectedDisaster} />
        </>
      ) : (
        <div className="welcome-message">
          <p>👋 Welcome to the Social Media Monitor!</p>
          <p>Please select a disaster to view social media and official updates.</p>
          <ul>
            <li>🔔 Real-time updates via WebSocket</li>
            <li>⚡ Priority alerts with notifications</li>
            <li>📱 Mobile-friendly interface</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SocialMediaMonitor;
