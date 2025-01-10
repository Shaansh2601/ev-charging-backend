const axios = require("axios");
const fs = require("fs");

const fetchChargingStations = async () => {
  const apiKey = "1d305b09-53bd-4063-894d-f27d4b5aac80";
  const latitude = 51.5074;
  const longitude = -0.1278;
  const distance = 20;

  const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${latitude}&longitude=${longitude}&distance=${distance}&maxresults=250&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    fs.writeFileSync(
      "charging_stations.json",
      JSON.stringify(response.data, null, 2)
    );
    console.log("Data saved to charging_stations.json");
  } catch (error) {
    console.log("Error fetching data", error);
  }
};
fetchChargingStations();
