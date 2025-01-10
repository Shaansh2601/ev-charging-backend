const express = require("express");
const router = express.Router();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "ev-charging-db.mysql.database.azure.com",
  user: "amrit",
  password: "Amrit@123",
  database: "ev_charging",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    return;
  }
  console.log("Connected to the database");
});

router.get("/", (req, res) => {
  const query = "SELECT * FROM charging_stations";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error Fetching Stations:", err.message);
      res.status(500).json({ error: "Failed to fetch data" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;
