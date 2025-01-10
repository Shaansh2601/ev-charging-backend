const express = require("express");
const mysql = require("mysql2");
const router = express.Router();

const db = mysql.createConnection({
  host: "ev-charging-db.mysql.database.azure.com",
  user: "amrit",
  password: "Amrit@123",
  database: "ev_charging",
});

router.get("/", (req, res) => {
  db.query("SELECT * FROM charging_stations", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch data" });
    res.json(results);
  });
});

router.post("/start-charging", (req, res) => {
  const { station_id, user_id } = req.body;
  const start_time = new Date();

  const query = `
    INSERT INTO sessions (station_id, user_id, start_time, status)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    query,
    [station_id, user_id, start_time, "active"],
    (err, result) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({ error: "Failed to start session" });
      }
      console.log("Session started successfully:", result);
      res.json({ message: "Session started", session_id: result.insertId });
    }
  );
});

router.post("/complete-charging", (req, res) => {
  const { session_id } = req.body;
  const end_time = new Date();

  const fetchQuery = `
      SELECT s.start_time, cs.power_kw
      FROM sessions s
      JOIN charging_stations cs ON s.station_id = cs.id
      WHERE s.session_id = ?
    `;

  db.query(fetchQuery, [session_id], (err, result) => {
    if (err)
      return res.status(500).json({ error: "Failed to fetch session details" });

    if (result.length === 0)
      return res.status(404).json({ error: "Session not found" });

    const { start_time, power_kw } = result[0];
    const rate_per_hour = 20;
    const duration_hours = (end_time - new Date(start_time)) / (1000 * 60 * 60);

    const total_cost = power_kw * duration_hours * rate_per_hour;

    const updateQuery = `
        UPDATE sessions
        SET end_time = ?, status = ?, total_cost = ?
        WHERE session_id = ?
      `;

    db.query(
      updateQuery,
      [end_time, "completed", total_cost, session_id],
      (err, updateResult) => {
        if (err)
          return res.status(500).json({ error: "Failed to complete session" });

        res.json({
          message: "Session completed",
          total_cost: total_cost.toFixed(2),
        });
      }
    );
  });
});

router.post("/get-cost", (req, res) => {
  const { session_id } = req.body;

  const query = `
      SELECT total_cost 
      FROM sessions 
      WHERE session_id = ?
    `;

  db.query(query, [session_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch cost" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ total_cost: result[0].total_cost });
  });
});

module.exports = router;
