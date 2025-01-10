const mysql = require("mysql2");
const stations = require("../charging_stations.json");

const db = mysql.createConnection({
  host: "ev-charging-db.c9egug0iee0z.eu-north-1.rds.amazonaws.com",
  user: "admin",
  password: "Khajuria987",
  database: "ev_charging",
});

stations.forEach((station, index) => {
  const { Title, AddressInfo, Connections } = station;
  let { Latitude, Longitude, AddressLine1 } = AddressInfo || {};

  if (AddressLine1 === "null") {
    AddressLine1 = "City of London";
  }

  const stationName = Title || AddressInfo?.Title || "Unknown Station";

  if (/opp\./i.test(stationName) || /opp\./i.test(AddressLine1)) {
    return;
  }

  if (
    stationName &&
    Latitude &&
    Longitude &&
    AddressLine1 &&
    Connections &&
    Connections.length > 0
  ) {
    const connectorType = Connections.map(
      (conn) => conn.ConnectionType.Title
    ).join(", ");

    const power_kw =
      Connections.map((conn) => conn.PowerKW).join(", ") || "Unknown Power";

    const query = `
      INSERT INTO charging_stations (station_name, latitude, longitude, address, connector_type, power_kw)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      stationName,
      Latitude || 0.0,
      Longitude || 0.0,
      AddressLine1 || "Unknown Address",
      connectorType || "Unknown Connector",
      power_kw,
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Error inserting data:", err);
      } else {
        console.log("Inserted station:", result.insertId);
      }
    });
  } else {
    console.log("Skipping station due to missing required fields:", station);
  }

  // Close the connection after the last station is processed
  if (index === stations.length - 1) db.end();
});
