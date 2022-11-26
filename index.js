const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Reuse and Reduce Server ...");
});

const tokenVerify = (req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authToken.split(" ")[1];
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
  const Booking = client.db("reuseReduceDatabase").collection("booking");
  const Payments = client.db("reuseReduceDatabase").collection("payments");

  try {
    app.get("/my-buyers/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { seller_email: email };
      const myBuyers = await Payments.find(filter).toArray();
      res.send(myBuyers);
    });

    app.post("/payments", async (req, res) => {
      const paymentInfo = req.body;
      const payments = await Payments.insertOne(paymentInfo);

      const bookingId = paymentInfo.paymentId;
      const filter = { _id: ObjectId(bookingId) };
      const updatedInfo = {
        $set: {
          paymentStatus: true,
          transectionId: paymentInfo.transectionId,
        },
      };
      const result = await Booking.updateOne(filter, updatedInfo);
      res.send(payments);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const amount = parseInt(booking.price);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await Users.findOne(query);
      res.send({
        isCombineUser: user?.role === "admin" || user?.userType === "Seller",
      });
    });

    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const booking = await Booking.findOne(filter);
      res.send(booking);
    });

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const bookings = await Booking.find(query).toArray();
      res.send(bookings);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await Booking.insertOne(booking);
      res.send(result);
    });

    app.get("/reported-products", async (req, res) => {
      const query = {
        report: true,
      };
      const products = await Products.find(query).toArray();
      res.send(products);
    });

    app.get("/advertiseProduct", async (req, res) => {
      const filter = { advertise: true };
      const products = await Products.find(filter).toArray();
      res.send(products);
    });

    app.get("/all-products", async (req, res) => {
      const query = {};
      const products = await Products.find(query).toArray();
      res.send(products);
    });

    app.delete("/my-products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const deleteProduct = await Products.deleteOne(filter);
      res.send(deleteProduct);
    });

    app.get("/my-products", async (req, res) => {
      const email = req.query.email;
      const filter = { email };
      const user = await Users.findOne(filter);

      if (user?.userType === "Seller" || user?.role === "admin") {
        const query = { email: email };
        const products = await Products.find(query).toArray();
        return res.send(products);
      }
    });

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updatedInfo = {
        $set: {
          advertise: true,
        },
      };
      const updated = await Products.updateOne(filter, updatedInfo);
      res.send(updated);
    });

    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updatedInfo = {
        $set: {
          sold: true,
        },
      };
      const updated = await Products.updateOne(filter, updatedInfo);
      res.send(updated);
    });

    app.patch("/products/report/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updatedInfo = {
        $set: {
          report: true,
        },
      };
      const updated = await Products.updateOne(filter, updatedInfo);
      res.send(updated);
    });

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

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const deleteUser = await Users.deleteOne(filter);
      res.send(deleteUser);
    });

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email };
      const options = { upsert: true };
      const updatedInfo = {
        $set: {
          name: user.name,
          email: user.email,
          userType: user.userType,
        },
      };
      const updated = await Users.updateOne(filter, updatedInfo, options);
      res.send(updated);
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
