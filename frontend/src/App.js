import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function App() {
  const [form, setForm] = useState({
    SPX: "",
    USO: "",
    SLV: "",
    EURUSD: "",
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const [metrics, setMetrics] = useState(null);
  const [corrData, setCorrData] = useState(null);
  const [distData, setDistData] = useState(null);

  // Backend base URL
  const API = "http://127.0.0.1:5000";

  // Fetch Metrics
  const fetchMetrics = async () => {
    try {
      const res = await axios.get(`${API}/metrics`);
      setMetrics(res.data);
    } catch (err) {
      console.log(" Metrics fetch failed");
    }
  };

  // Fetch Correlation
  const fetchCorrelation = async () => {
    try {
      const res = await axios.get(`${API}/correlation`);
      setCorrData(res.data.correlation_with_gld);
    } catch (err) {
      console.log(" Correlation fetch failed");
    }
  };

  // Fetch Distribution
  const fetchDistribution = async () => {
    try {
      const res = await axios.get(`${API}/gld_distribution`);
      setDistData(res.data);
    } catch (err) {
      console.log(" Distribution fetch failed");
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchCorrelation();
    fetchDistribution();
  }, []);

  // Handle Inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Predict
  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API}/predict`, form);
      setPrediction(res.data.prediction);
      fetchMetrics();
    } catch (err) {
      alert(" Backend not running OR invalid input!");
    }

    setLoading(false);
  };

  // Correlation Chart (REAL)
  const correlationChartData =
    corrData !== null
      ? {
          labels: ["SPX", "USO", "SLV", "EUR/USD"],
          datasets: [
            {
              label: "Correlation with GLD",
              data: [
                corrData.SPX,
                corrData.USO,
                corrData.SLV,
                corrData.EURUSD,
              ],
              backgroundColor: "green",
              borderColor: "green",
              borderWidth: 2,
            },
          ],
        }
      : null;

  // GLD Distribution Chart (REAL)
  const gldDistChartData =
    distData !== null
      ? {
          labels: distData.labels,
          datasets: [
            {
              label: "GLD Distribution",
              data: distData.counts,
              backgroundColor: "green",
              borderColor: "green",
              borderWidth: 1,
            },
          ],
        }
      : null;

  // Prediction Trend Chart
  const predictionTrendData =
    prediction !== null
      ? {
          labels: ["Yesterday", "Today", "Tomorrow"],
          datasets: [
            {
              label: "Gold Price Trend",
              data: [prediction - 3, prediction, prediction + 2],
              borderColor: "gold",
              backgroundColor: "gold",
              borderWidth: 3,
            },
          ],
        }
      : null;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}> Gold Price Prediction</h1>
      <p style={styles.subtitle}>
        React + Flask | Random Forest Regressor Model
      </p>

      {/* Predict Form */}
      <form style={styles.card} onSubmit={handlePredict}>
        <h2 style={{ marginTop: 0 }}>Enter Values</h2>

        <input
          style={styles.input}
          type="number"
          step="any"
          name="SPX"
          placeholder="Enter SPX Value"
          value={form.SPX}
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          type="number"
          step="any"
          name="USO"
          placeholder="Enter USO Value"
          value={form.USO}
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          type="number"
          step="any"
          name="SLV"
          placeholder="Enter SLV Value"
          value={form.SLV}
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          type="number"
          step="any"
          name="EURUSD"
          placeholder="Enter EUR/USD Value"
          value={form.EURUSD}
          onChange={handleChange}
          required
        />

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Predicting..." : "Predict Gold Price"}
        </button>
      </form>

      {/* Prediction Result */}
      {prediction !== null && (
        <div style={styles.resultBox}>
          <h2 style={{ margin: 0 }}> Predicted Gold Price</h2>
          <h1 style={styles.price}>${prediction}</h1>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div style={styles.metricsBox}>
          <h2 style={{ marginTop: 0 }}> Model Metrics</h2>

          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <h3>Test Metrics</h3>
              <p>R² Score: {metrics.test_metrics.r2}</p>
              <p>MAE: {metrics.test_metrics.mae}</p>
              <p>MSE: {metrics.test_metrics.mse}</p>
              <p>RMSE: {metrics.test_metrics.rmse}</p>
            </div>

            <div style={styles.metricCard}>
              <h3>K-Fold Cross Validation</h3>
              <p>Avg R²: {metrics.kfold_metrics.avg_r2}</p>
              <p>Avg MAE: {metrics.kfold_metrics.avg_mae}</p>
              <p>Avg MSE: {metrics.kfold_metrics.avg_mse}</p>
              <p>Avg RMSE: {metrics.kfold_metrics.avg_rmse}</p>
            </div>
          </div>
        </div>
      )}

      {/* Graphs Section */}
      <div style={styles.graphBox}>
        <h2 style={{ marginTop: 0 }}>Data Visualization</h2>

        <div style={styles.graphGrid}>
          <div style={styles.graphCard}>
            <h3>Correlation with GLD</h3>
            {correlationChartData ? (
              <Bar data={correlationChartData} />
            ) : (
              <p>Loading correlation graph...</p>
            )}
          </div>

          <div style={styles.graphCard}>
            <h3>GLD Distribution</h3>
            {gldDistChartData ? (
              <Bar data={gldDistChartData} />
            ) : (
              <p>Loading distribution graph...</p>
            )}
          </div>
        </div>
      </div>

      {/* Prediction Trend */}
      {predictionTrendData && (
        <div style={styles.graphBox}>
          <h2 style={{ marginTop: 0 }}> Predicted Trend</h2>
          <div style={styles.graphCard}>
            <Line data={predictionTrendData} />
          </div>
        </div>
      )}

      <p style={styles.footer}>Made  using Flask + React</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(120deg, #0f172a, #1e3a8a)",
    color: "white",
    padding: "30px",
    fontFamily: "Arial",
    textAlign: "center",
  },
  title: {
    fontSize: "42px",
    fontWeight: "bold",
    color: "gold",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "16px",
    opacity: 0.9,
    marginBottom: "30px",
  },
  card: {
    width: "420px",
    margin: "auto",
    padding: "25px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "0px 6px 20px rgba(0,0,0,0.4)",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    outline: "none",
    fontSize: "15px",
  },
  button: {
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    background: "gold",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  resultBox: {
    marginTop: "25px",
    width: "420px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "20px",
    borderRadius: "14px",
    background: "rgba(255, 215, 0, 0.15)",
    boxShadow: "0px 6px 20px rgba(0,0,0,0.4)",
  },
  price: {
    fontSize: "52px",
    color: "gold",
    marginTop: "10px",
    marginBottom: 0,
  },
  metricsBox: {
    marginTop: "30px",
    width: "900px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "20px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0px 6px 20px rgba(0,0,0,0.4)",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    marginTop: "10px",
  },
  metricCard: {
    padding: "15px",
    borderRadius: "12px",
    background: "rgba(0,0,0,0.25)",
    textAlign: "left",
  },
  graphBox: {
    marginTop: "30px",
    width: "900px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "20px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0px 6px 20px rgba(0,0,0,0.4)",
  },
  graphGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginTop: "15px",
  },
  graphCard: {
    padding: "15px",
    borderRadius: "12px",
    background: "rgba(0,0,0,0.25)",
    textAlign: "center",
  },
  footer: {
    marginTop: "40px",
    opacity: 0.7,
    fontSize: "14px",
  },
};
