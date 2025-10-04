const express = require("express");
const app = express();
const http = require("http"); // Import http module to create server
const { Server } = require("socket.io");

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

const server = http.createServer(app); // Create an HTTP server
app.use(
  cors({
    origin: "*",
    methods: "*",
    credentials: true,
  })
);

// max allowed file size change to 10mb
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(express.json());
app.use(upload());

app.use(express.static(__dirname + "assets"));
app.use("/images", express.static(__dirname + "/assets"));
app.use("/asset", express.static(__dirname + "/assets"));
app.use("/documents", express.static(__dirname + "/assets/documents"));
app.use(
  "/vendor-documents",
  express.static(__dirname + "/assets/documents/vendor")
);
app.use("/invoices", express.static(__dirname + "/assets/invoices"));
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

import("./cron/cronScheduler.js");
import("./cron/jobSchedulerCron.js");

server.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);
