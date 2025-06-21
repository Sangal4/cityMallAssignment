import { useState } from "react";
import DisasterManager from "./DisasterManager";
import ResourceManager from "./ResourceManager";
import SocialMediaMonitor from "./SocialMediaMonitor";
import ReportSubmitter from "./ReportSubmitter";
import "./Dashboard.css";

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("disasters");

  const tabs = [
    { id: "disasters", label: "Disasters", component: DisasterManager },
    { id: "resources", label: "Resources", component: ResourceManager },
    {
      id: "social-media",
      label: "Social Media",
      component: SocialMediaMonitor,
    },
    { id: "reports", label: "Submit Report", component: ReportSubmitter },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Disaster Response Platform</h1>
        <div className="user-info">
          <span>
            Welcome, {user.username} ({user.role})
          </span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {ActiveComponent && <ActiveComponent user={user} />}
      </main>
    </div>
  );
}

export default Dashboard;
