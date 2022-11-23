const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Reuse and Reduce Server ...");
});

const tokenVerify = (req, res, next) => {};

const url = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.7ywptfp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const dbConnect = async () => {
  const Users = client.db("reuseReduceDatabase").collection("users");

  try {
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await Users.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const query = {};
      const users = await Users.find(query).toArray();
      res.send(users);
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const user = await Users.findOne(query);

      if (user) {
        const token = jwt.sign({ email }, process.env.JWT_ACCESS_TOKEN, {
          expiresIn: "1d",
        });
        return res.send({ reuseReduceToken: token });
      }
      res.status(403).send({ message: "forbidden access" });
    });
  } finally {
  }
};

dbConnect().catch((err) => console.log(err.name, err.message));

app.listen(port, () => {
  console.log("Reuse and Reduce Server Running on:", port);
});
