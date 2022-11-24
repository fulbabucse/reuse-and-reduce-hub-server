const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

const tokenVerify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

const url = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.7ywptfp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const dbConnect = async () => {
  const Users = client.db("reuseReduceDatabase").collection("users");
  const Categories = client.db("reuseReduceDatabase").collection("categories");
  const Products = client.db("reuseReduceDatabase").collection("products");

  try {
    app.get("/products", async (req, res) => {
      const categoryName = req.query.category;
      const query = { category_name: categoryName };
      const products = await Products.find(query).toArray();
      res.send(products);
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await Products.insertOne(product);
      res.send(result);
    });

    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const categories = await Categories.findOne(query);
      res.send(categories);
    });

    app.get("/categories", async (req, res) => {
      const query = {};
      const categories = await Categories.find(query).toArray();
      res.send(categories);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await Users.insertOne(user);
      res.send(result);
    });

    app.get("/users", tokenVerify, async (req, res) => {
      const query = {};
      const users = await Users.find(query).toArray();
      res.send(users);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await Users.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    app.put("/users/admin/:id", tokenVerify, async (req, res) => {
      const email = req.decoded.email;
      const query = { email };
      const user = await Users.findOne(query);

      if (user?.role !== "admin") {
        return res.status(401).send({ message: "unauthorized access" });
      }

      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedInfo = {
        $set: {
          role: "admin",
        },
      };
      const updated = await Users.updateOne(filter, updatedInfo, options);
      res.send(updated);
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
