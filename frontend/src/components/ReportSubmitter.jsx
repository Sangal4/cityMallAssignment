import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://citymall-assignment-w2q4.onrender.com/api";

function ReportSubmitter({ user }) {
  const [disasters, setDisasters] = useState([]);
  const [formData, setFormData] = useState({
    disaster_id: "",
    content: "",
    image_url: "",
  });
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDisasters();
  }, []);

  const fetchDisasters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/disasters`);
      setDisasters(response.data.disasters || []);
    } catch (error) {
      console.error("Error fetching disasters:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Submit report (mock - would normally save to database)
      console.log("Report submitted:", formData);

      // Verify image if provided
      if (formData.image_url) {
        const verificationResponse = await axios.post(
          `${API_BASE}/verification/${formData.disaster_id}/verify-image`,
          { image_url: formData.image_url }
        );
        setVerificationResult(verificationResponse.data.verification);
      }

      setFormData({ disaster_id: "", content: "", image_url: "" });
      alert("Report submitted successfully!");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Error submitting report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-submitter">
      <h2>Submit Disaster Report</h2>

      <form onSubmit={handleSubmit} className="report-form">
        <select
          value={formData.disaster_id}
          onChange={(e) =>
            setFormData({ ...formData, disaster_id: e.target.value })
          }
          required
        >
          <option value="">Select Disaster</option>
          {disasters.map((disaster) => (
            <option key={disaster.id} value={disaster.id}>
              {disaster.title}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Report content (location will be automatically extracted)"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          required
        />

        <input
          type="url"
          placeholder="Image URL (optional - for verification)"
          value={formData.image_url}
          onChange={(e) =>
            setFormData({ ...formData, image_url: e.target.value })
          }
        />

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>

      {verificationResult && (
        <div className="verification-result">
          <h3>Image Verification Result</h3>
          <div
            className={`verification-status ${
              verificationResult.verified ? "verified" : "not-verified"
            }`}
          >
            <strong>Status:</strong>{" "}
            {verificationResult.verified ? "Verified" : "Not Verified"}
          </div>
          <p>
            <strong>Confidence:</strong>{" "}
            {(verificationResult.confidence * 100).toFixed(1)}%
          </p>
          <p>
            <strong>Reason:</strong> {verificationResult.reason}
          </p>
          {verificationResult.manipulation_detected && (
            <p className="warning">⚠️ Signs of manipulation detected</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportSubmitter;
