require("dotenv").config();
const express = require("express");
const cors = require("cors");
const usersRouter = require("./src/routes/usersRoute");
const listingsRouter = require("./src/routes/listing");
const messagesRouter = require("./src/routes/messages");
const profileRouter = require("./src/routes/profile");

const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());

// setup CORS to allow requests from SWA and local development
const allowedOrigins = ["https://nice-water-0d3098403.1.azurestaticapps.net"];

const isLocalhostOrigin = (origin) => {
  if (!origin) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (isLocalhostOrigin(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

// Example route

app.use("/users", usersRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/profile", profileRouter);

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});
