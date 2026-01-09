// Modified server for demo mode without a physical Tello drone
// This version serves static video/images for testing the ML model

const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

const ws = require("ws");
const express = require("express");
const app = express();

const HOST = "127.0.0.1";
const PORT = 5000;
const PORT2 = 5001;

app.use(express.static(path.join(__dirname, "public")));

// Demo mode endpoints (no drone required)
app.post("/streamon", async (req, res) => {
  console.log("Demo mode: Stream started (using test images)");
  res.json({ status: "ok", message: "Demo mode - no physical drone required" });
});

app.post("/streamoff", async (req, res) => {
  console.log("Demo mode: Stream stopped");
  res.json({ status: "ok", message: "Demo mode stream stopped" });
});

app.get("/battery", async (req, res) => {
  // Return a mock battery level
  const mockBattery = Math.floor(Math.random() * 30) + 70; // 70-100%
  res.send(mockBattery.toString());
});

// HTTP Server
const server = app.listen(PORT, HOST, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`\n====================================`);
  console.log(`🚁 DroneAid Demo Server Started`);
  console.log(`====================================`);
  console.log(`Server: http://${host}:${port}/`);
  console.log(`Mode: DEMO (No physical drone required)`);
  console.log(`\nOpen your browser and navigate to:`);
  console.log(`  http://127.0.0.1:${port}/\n`);
  console.log(`The dashboard will load with demo data.`);
  console.log(`You can test the ML model by placing`);
  console.log(`DroneAid symbol images in the camera view.\n`);
});

// Websocket Server for video data
const streamSocket = new ws.Server({ server: server });
const commandSocket = new ws.Server({ port: PORT2 });

streamSocket.broadcast = function (data) {
  streamSocket.clients.forEach(function each(client) {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  });
};

commandSocket.broadcast = function (data) {
  commandSocket.clients.forEach(function each(client) {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  });
};

// Demo mode: Send mock drone state periodically
setInterval(() => {
  const mockState = `pitch:0;roll:0;yaw:0;vgx:0;vgy:0;vgz:0;templ:45;temph:47;tof:10;h:0;bat:${Math.floor(Math.random() * 30) + 70};baro:0.00;time:0;agx:0.00;agy:0.00;agz:0.00;`;
  commandSocket.broadcast(mockState);
}, 1000);

commandSocket.on("connection", function connection(ws) {
  console.log("WebSocket client connected");
  ws.on("message", function incoming(message) {
    console.log("Demo mode - received command: %s", message);
    // In demo mode, we just acknowledge commands
  });
});

// Graceful shutdown
const exitHandler = (options) => {
  if (options.cleanup) {
    console.log("\nShutting down demo server...");
  }
  if (options.exit) {
    process.exit();
  }
};

process.on("exit", exitHandler.bind(null, { cleanup: true }));
process.on("SIGINT", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
