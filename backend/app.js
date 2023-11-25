require("dotenv").config();
const cors = require("cors");
const express = require("express");
const axios = require("axios");
const protobuf = require("protobufjs");
const routeData = require("./data/routeData.json");

// Initialize the express app
const app = express();

// Enable CORS requests from whitelisted origin
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Load the .proto schema
const root = protobuf.loadSync("gtfs.proto");

// Use the 'FeedMessage' message type from the .proto file
const FeedMessage = root.lookupType("transit_realtime.FeedMessage");

// GET /api/:stopIdPrefix - Get the next scheduled arrivals based on the stopId
app.get("/api/:stopIdPrefix", async (req, res, next) => {
  const { stopIdPrefix } = req.params;
  const routeName = stopIdPrefix[0];
  const { mtaEndpoint, northBoundLastStop, southBoundLastStop } =
    routeData[routeName];

  try {
    // Fetch data from MTA's API
    const { data } = await axios.get(mtaEndpoint, {
      headers: {
        "x-api-key": process.env.API_KEY,
      },
      responseType: "arraybuffer",
    });

    // Decode the protocol buffer data
    const message = FeedMessage.decode(new Uint8Array(data));
    const object = FeedMessage.toObject(message, {
      longs: String,
      enums: String,
      bytes: String,
    });

    // Destructure the entity
    const { entity } = object;

    // Create two arrays to store time strings
    const northBoundTimes = [];
    const southBoundTimes = [];

    entity
      // Filter for objects that include stopTimeUpdates
      .filter((ent) => ent.tripUpdate && ent.tripUpdate.stopTimeUpdate)
      .forEach(({ tripUpdate: { stopTimeUpdate } }) => {
        // Filter for the correct stop
        stopTimeUpdate
          .filter(
            ({ stopId, arrival }) =>
              arrival && arrival.time && stopId.startsWith(stopIdPrefix)
          )
          .forEach((update) => {
            // Push north and south bound times into their respective arrays
            const arrivalTime = new Date(parseInt(update.arrival.time) * 1000);
            update.stopId.substr(-1) === "N"
              ? northBoundTimes.push(`${arrivalTime.toLocaleTimeString()}`)
              : southBoundTimes.push(`${arrivalTime.toLocaleTimeString()}`);
          });
      });

    // Return response data with the route's north and south bound information
    return res.json({
      routeName,
      northBound: { lastStop: northBoundLastStop, times: northBoundTimes },
      southBound: { lastStop: southBoundLastStop, times: southBoundTimes },
    });
  } catch (err) {
    console.error("Error fetching or decoding data", err);
    return res.status(500).send("Internal Server Error");
  }
});

// Start listening on the port defined in the env file or 3000 if it's undefined
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App listening on port: ${PORT}`);
});
