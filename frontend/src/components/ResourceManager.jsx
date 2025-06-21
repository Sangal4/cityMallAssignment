import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "https://citymall-assignment-w2q4.onrender.com/api";

function ResourceManager({ user }) {
  const [resources, setResources] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [formData, setFormData] = useState({
    disaster_id: "",
    name: "",
    location_name: "",
    type: "",
  });
  const [searchParams, setSearchParams] = useState({
    lat: "",
    lon: "",
    radius: "10",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDisasters();
    fetchResources();
  }, []);

  const fetchDisasters = async () => {
    try {
      const response = await axios.get(`${API_BASE}/disasters`);
      setDisasters(response.data.disasters || []);
    } catch (error) {
      console.error("Error fetching disasters:", error);
    }
  };

  const fetchResources = async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_BASE}/resources?${queryParams}`);
      setResources(response.data.resources || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/resources/${editingId}`, formData, {
          headers: { "x-username": user.username },
        });
        setEditingId(null);
      } else {
        await axios.post(`${API_BASE}/resources`, formData, {
          headers: { "x-username": user.username },
        });
      }

      setFormData({ disaster_id: "", name: "", location_name: "", type: "" });
      fetchResources();
    } catch (error) {
      console.error("Error saving resource:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (searchParams.lat && searchParams.lon) {
      params.lat = searchParams.lat;
      params.lon = searchParams.lon;
      params.radius = searchParams.radius;
    }
    fetchResources(params);
  };

  const handleEdit = (resource) => {
    setEditingId(resource.id);
    setFormData({
      disaster_id: resource.disaster_id,
      name: resource.name,
      location_name: resource.location_name,
      type: resource.type,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      try {
        await axios.delete(`${API_BASE}/resources/${id}`, {
          headers: { "x-username": user.username },
        });
        fetchResources();
      } catch (error) {
        console.error("Error deleting resource:", error);
      }
    }
  };

  return (
    <div className="resource-manager">
      <h2>{editingId ? "Edit Resource" : "Create New Resource"}</h2>

      <form onSubmit={handleSubmit} className="resource-form">
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
        <input
          type="text"
          placeholder="Resource Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Location Name"
          value={formData.location_name}
          onChange={(e) =>
            setFormData({ ...formData, location_name: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Type (e.g., shelter, food, medical)"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
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
                disaster_id: "",
                name: "",
                location_name: "",
                type: "",
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <h3>Search Resources by Location</h3>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={searchParams.lat}
          onChange={(e) =>
            setSearchParams({ ...searchParams, lat: e.target.value })
          }
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={searchParams.lon}
          onChange={(e) =>
            setSearchParams({ ...searchParams, lon: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Radius (km)"
          value={searchParams.radius}
          onChange={(e) =>
            setSearchParams({ ...searchParams, radius: e.target.value })
          }
        />
        <button type="submit">Search</button>
        <button type="button" onClick={() => fetchResources()}>
          Show All
        </button>
      </form>

      <h3>Resources</h3>
      <div className="resources-list">
        {resources.map((resource) => (
          <div key={resource.id} className="resource-item">
            <h4>{resource.name}</h4>
            <p>
              <strong>Type:</strong> {resource.type}
            </p>
            <p>
              <strong>Location:</strong> {resource.location_name}
            </p>
            <p>
              <strong>Disaster:</strong>{" "}
              {disasters.find((d) => d.id === resource.disaster_id)?.title}
            </p>
            <div className="resource-actions">
              <button onClick={() => handleEdit(resource)}>Edit</button>
              <button onClick={() => handleDelete(resource.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResourceManager;
