const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

require("dotenv").config();
const port = process.env.PORT || 5000;
const cors = require("cors");
const upload = require("express-fileupload");
const db = require("./config/db");
const superRouter = require("./router/adminSuper");
const vendorRouter = require("./router/vendor");
const planRouter = require("./router/plan");
const empRouter = require("./router/employee");
const path = require("path");

const jobRouter = require("./router/job");
const trackRouter = require("./router/tracking");
const credentialRouter = require("./router/credential");
const feedRouter = require("./router/feedBack");
const shiftRouter = require("./router/shift");
const stateRouter = require("./router/state");
const leaveRouter = require("./router/leaves");
const rewardRoutes = require("./router/rewardRoutes.js");
const invoiceRoutes = require("./router/invoiceRoutes");
const IDB_SYS = require("./router/idb_sys.js");
db();

// Ensure assets directories exist
const assetsPath = path.join(__dirname, "assets");
const documentsPath = path.join(assetsPath, "documents");
const vendorDocumentsPath = path.join(documentsPath, "vendor");
const clientDocumentsPath = path.join(documentsPath, "clients");
const invoicesPath = path.join(assetsPath, "invoices");
const uploadsPath = path.join(__dirname, "uploads");

// Create directories if they don't exist
[
  assetsPath,
  documentsPath,
  vendorDocumentsPath,
  clientDocumentsPath,
  invoicesPath,
  uploadsPath,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const server = http.createServer(app);
app.use(
  cors({
    origin: "*",
    methods: "*",
    credentials: true,
  })
);

// Increased payload limits
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// File upload configuration
app.use(
  upload({
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
      files: 10, // Maximum number of files
    },
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "temp-uploads"),
    createParentPath: true,
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
    limitHandler: (req, res) => {
      res.status(413).json({
        message: "File too large or too many files",
      });
    },
  })
);

// Static file serving
app.use(express.static(__dirname + "assets"));
app.use("/images", express.static(__dirname + "/assets"));
app.use("/asset", express.static(__dirname + "/assets"));
app.use("/documents", express.static(__dirname + "/assets/documents"));
app.use(
  "/vendor-documents",
  express.static(__dirname + "/assets/documents/vendor")
);
// Also handle /api/vendor-documents for backward compatibility with old data
app.use(
  "/api/vendor-documents",
  express.static(__dirname + "/assets/documents/vendor")
);
app.use("/invoices", express.static(__dirname + "/assets/invoices"));
app.use(
  "/v1/client-documents",
  express.static(path.join(__dirname, "assets/documents/clients"))
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/v1/admin", superRouter);
app.use("/v1/plan", planRouter);
app.use("/v1/emp", empRouter);
app.use("/v1/vendor", vendorRouter);
app.use("/v1/vendor/invoices", invoiceRoutes);
app.use("/v1/job", jobRouter);
app.use("/v1/tracking", trackRouter);
app.use("/v1/credentials", credentialRouter);
app.use("/v1/feed", feedRouter);
app.use("/v1/shift", shiftRouter);
app.use("/v1/state", stateRouter);
app.use("/v1/leaves", leaveRouter);
app.use("/v1/rewards", rewardRoutes);
app.use("/v1/vendor", IDB_SYS);

app.use(express.static(path.join(__dirname, "build")));

// Cron jobs
import("./cron/cronScheduler.js");
import("./cron/jobSchedulerCron.js");

server.listen(port, () => console.log(`Server running on port ${port}!`));
