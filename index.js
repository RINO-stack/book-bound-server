const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const verifyAdminToken = require('./verifyAdminToken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const jwtSecretKey = process.env.JWT_SECRET_KEY || 'your_jwt_secret_key';

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// MongoDB configuration
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db("BookInventory");
    const bookCollections = db.collection("books");
    const userCollection = db.collection("users");

    // Upload a book
    app.post("/upload-book", async (req, res) => {
      const data = req.body;
      const result = await bookCollections.insertOne(data);
      res.send(result);
    });

    // Update book data
    app.patch("/book/:id", async (req, res) => {
      const id = req.params.id;
      const updateBookData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { ...updateBookData } };
      const result = await bookCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete a book
    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bookCollections.deleteOne(filter);
      res.send(result);
    });

    // Get all books
    app.get("/all-books", async (req, res) => {
      let query = {};
      if (req.query?.category) {
        query = { category: req.query.category };
      }
      const result = await bookCollections.find(query).toArray();
      res.send(result);
    });

    // Get a single book
    app.get("/book/:id",  async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bookCollections.findOne(filter);
      res.send(result);
    });

    // User Authentication (Admin Login)
    app.post("/admin", async (req, res) => {
      const { username, password } = req.body;
      try {
        const admin = await userCollection.findOne({ username });
        
        if (!admin) {
          return res.status(404).send({ message: "Admin not found" });
        }

        const isMatch = password === admin.password;
        if (!isMatch) {
          return res.status(401).send({ message: "Invalid password" });
        }

        const token = jwt.sign(
          { id: admin._id, username: admin.username, role: admin.role },
          jwtSecretKey,
          { expiresIn: "1h" }
        );

        return res.status(200).send({
          message: "Admin logged in successfully",
          token,
          user: { username: admin.username, role: admin.role },
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to login as admin" });
      }
    });

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // Close the MongoDB client when the app stops
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
