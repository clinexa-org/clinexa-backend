import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

/**
 * Initialize Socket.io with JWT authentication
 * @param {http.Server} server - HTTP server instance
 */
export const initSocket = (server) => {
  if (io) return io;
  
  // Vercel/Serverless hack: Check if IO is already attached to the HTTP server
  if (server.io) {
    console.log("[Socket] Reusing existing Socket.io instance");
    io = server.io;
    return io;
  }

  io = new Server(server, {
    path: "/socket.io", // Explicit path often helps
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Attach to server for persistence across lambda invocations in same container
  server.io = io;

  // JWT Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, role }
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    const userRoom = `user:${userId}`;
    
    // Join user-specific room
    socket.join(userRoom);
    console.log(`[Socket] User ${userId} connected, joined room ${userRoom}`);

    socket.on("disconnect", () => {
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  console.log("[Socket] Socket.io initialized with JWT auth");
  return io;
};

/**
 * Get the Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
};

/**
 * Emit event to a specific user's room
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {object} payload - Event payload
 */
export const emitToUser = (userId, event, payload) => {
  if (!io) {
    console.warn("[Socket] Socket.io not initialized, skipping emit");
    return;
  }
  
  const userRoom = `user:${userId}`;
  io.to(userRoom).emit(event, payload);
  console.log(`[Socket] Emitted ${event} to ${userRoom}`);
};

export default { initSocket, getIO, emitToUser };
