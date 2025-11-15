import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

const COLORS = ["#facc15", "#22c55e", "#ef4444"]; // gold, green, red

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/alerts");
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDecision = async (id, action) => {
    try {
      await axios.post("http://localhost:3001/api/action", {
        alertId: id,
        action,
      });
      toast.success(`Marked as ${action.toUpperCase()}`);
      fetchAlerts();
    } catch (err) {
      console.error(err);
      toast.error("Error saving action");
    }
  };

  const chartData = [
    { name: "Alerts", value: alerts.length },
    { name: "Approved", value: alerts.filter((a) => a.analyst_action === "approve").length },
    { name: "Blocked", value: alerts.filter((a) => a.analyst_action === "block").length },
  ];

  return (
    <div className={`app ${dark ? "dark" : ""}`}>
      <Toaster position="top-right" />
      <header className="navbar">
        <h1>💳 Real-Time Fraud Detection Console</h1>
        <button onClick={() => setDark(!dark)} className="mode-btn">
          {dark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      <main className="main">
        <div className="cards">
          <motion.div whileHover={{ scale: 1.05 }} className="card blue">
            <h3>Total Alerts</h3>
            <p>{alerts.length}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="card green">
            <h3>Approved</h3>
            <p>{alerts.filter((a) => a.analyst_action === "approve").length}</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="card red">
            <h3>Blocked</h3>
            <p>{alerts.filter((a) => a.analyst_action === "block").length}</p>
          </motion.div>
        </div>

        <div className="chart-container">
          <h2>Fraud Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie dataKey="value" data={chartData} outerRadius={90} fill="#8884d8" label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <motion.div className="table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="table-header">
            <h2>Suspicious Transactions</h2>
            <button onClick={fetchAlerts}>🔄 Refresh</button>
          </div>

          {loading ? (
            <p>Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p>✅ No suspicious transactions right now.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Amount</th>
                  <th>Score</th>
                  <th>Decision</th>
                  <th>Reasons</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a, i) => (
                  <motion.tr key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                    <td>{a.account_id}</td>
                    <td>₹{a.amount?.toFixed(2) || "—"}</td>
                    <td>{a.score?.toFixed(2)}</td>
                    <td>
                      <span className={`status ${a.analyst_action || a.decision}`}>
                        {a.analyst_action || a.decision}
                      </span>
                    </td>
                    <td>{a.reasons?.join(", ") || "—"}</td>
                    <td>
                      <button className="approve" onClick={() => handleDecision(a._id, "approve")}>
                        ✅ Approve
                      </button>
                      <button className="block" onClick={() => handleDecision(a._id, "block")}>
                        ⛔ Block
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </main>
    </div>
  );
}
