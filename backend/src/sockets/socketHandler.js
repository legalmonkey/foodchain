const { Server } = require("socket.io");
const config = require("../config/env");

let ioInstance = null;

function setupSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room for specific user/wallet
    socket.on("joinUserRoom", (walletOrUserId) => {
      if (walletOrUserId) {
        socket.join(walletOrUserId.toLowerCase());
        console.log(`[Socket] Client ${socket.id} joined user room: ${walletOrUserId}`);
      }
    });

    // Join role-specific broadcast room (e.g. 'restaurant', 'delivery_partner', 'juror')
    socket.on("joinRoleRoom", (role) => {
      if (role) {
        socket.join(`role_${role}`);
        console.log(`[Socket] Client ${socket.id} joined role room: role_${role}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
}

function getIO() {
  return ioInstance;
}

module.exports = {
  setupSockets,
  getIO,
};
