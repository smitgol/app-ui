const express = require("express");
var cors = require("cors");
const app = express();
const port = 3001;

app.use(cors());

app.post("/api/state/cache", (req, res) => {
  res.send({ status: "data submitted" });
  res.status(204);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
