import { useState } from "react";

const mockUsers = [
  { id: "netrunnerX", username: "netrunnerX", role: "admin" },
  { id: "reliefAdmin", username: "reliefAdmin", role: "admin" },
  { id: "citizen1", username: "citizen1", role: "contributor" },
  { id: "citizen2", username: "citizen2", role: "contributor" },
];

function Login({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUser) {
      const user = mockUsers.find((u) => u.username === selectedUser);
      onLogin(user);
    }
  };

  return (
    <div className="login-container">
      <h2>Disaster Response Platform</h2>
      <form onSubmit={handleSubmit}>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          required
        >
          <option value="">Select a user</option>
          {mockUsers.map((user) => (
            <option key={user.username} value={user.username}>
              {user.username} ({user.role})
            </option>
          ))}
        </select>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
