import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://citymall-assignment-w2q4.onrender.com/api";

function DisasterManager({ user }) {
  const [disasters, setDisasters] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    location_name: "",
    description: "",
    tags: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDisasters();
  }, []);

  const fetchDisasters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/disasters`, {
        headers: { "x-username": user.username },
      });
      setDisasters(response.data.disasters || []);
    } catch (error) {
      console.error("Error fetching disasters:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      if (editingId) {
        await axios.put(`${API_BASE}/disasters/${editingId}`, data, {
          headers: { "x-username": user.username },
        });
        setEditingId(null);
      } else {
        await axios.post(`${API_BASE}/disasters`, data, {
          headers: { "x-username": user.username },
        });
      }

      setFormData({ title: "", location_name: "", description: "", tags: "" });
      fetchDisasters();
    } catch (error) {
      console.error("Error saving disaster:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (disaster) => {
    setEditingId(disaster.id);
    setFormData({
      title: disaster.title,
      location_name: disaster.location_name,
      description: disaster.description,
      tags: disaster.tags?.join(", ") || "",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this disaster?")) {
      try {
        await axios.delete(`${API_BASE}/disasters/${id}`, {
          headers: { "x-username": user.username },
        });
        fetchDisasters();
      } catch (error) {
        console.error("Error deleting disaster:", error);
      }
    }
  };

  return (
    <div className="disaster-manager">
      <h2>{editingId ? "Edit Disaster" : "Create New Disaster"}</h2>

      <form onSubmit={handleSubmit} className="disaster-form">
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Location Name (optional - will be extracted from description)"
          value={formData.location_name}
          onChange={(e) =>
            setFormData({ ...formData, location_name: e.target.value })
          }
        />
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : editingId ? "Update" : "Create"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData({
                title: "",
                location_name: "",
                description: "",
                tags: "",
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <h3>Disasters</h3>
      <div className="disasters-list">
        {disasters.map((disaster) => (
          <div key={disaster.id} className="disaster-item">
            <h4>{disaster.title}</h4>
            <p>
              <strong>Location:</strong> {disaster.location_name}
            </p>
            <p>
              <strong>Description:</strong> {disaster.description}
            </p>
            <p>
              <strong>Tags:</strong> {disaster.tags?.join(", ")}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(disaster.created_at).toLocaleString()}
            </p>
            <div className="disaster-actions">
              <button onClick={() => handleEdit(disaster)}>Edit</button>
              <button onClick={() => handleDelete(disaster.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DisasterManager;
