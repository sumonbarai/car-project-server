const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d4elm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("carproject").collection("services");
    const orderCollection = client.db("carproject").collection("order");

    // CREATE JWT TOKEN
    app.post("/login", async (req, res) => {
      const user = req.body;
      const assessToken = await jwt.sign(
        user,
        process.env.ASSESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.send({ assessToken });
    });
    // jwt verifycation code
    function verifyJwt(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorization" });
      }
      const token = authHeader.split(" ")[1];
      jwt.verify(
        token,
        process.env.ASSESS_TOKEN_SECRET,
        function (err, decoded) {
          if (err) {
            return res.status(403).send({ message: "forbidden user" });
          }
          req.decoded = decoded;
          next();
        }
      );
    }
    // load all service api GET
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    // load a single data by using dynamic id
    app.get("/service/:serviceId", async (req, res) => {
      const id = req.params.serviceId;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // save data to database by post method
    app.post("/service", async (req, res) => {
      const data = req.body;
      const result = await serviceCollection.insertOne(data);
      res.send(result);
    });

    // delete data by use id
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
    // oder data stored
    app.post("/order", async (req, res) => {
      const data = req.body;
      const result = await orderCollection.insertOne(data);
      res.send(result);
    });
    // order search quarry api
    app.get("/order", verifyJwt, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail === email) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });

    // get order data by queary search in email
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`server in running ${port}`);
});
