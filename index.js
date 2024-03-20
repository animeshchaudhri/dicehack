import { v2 as cloudinary } from "cloudinary";
import express from "express";
import { removeDaBg } from "./bgrem.js";
import { about_gen } from "./clasification.js";
import { lifestyleimg } from "./Lifestyle.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import { appendFileSync } from "fs";
const uri =
  "mongodb+srv://harshit:XBp7RhPso76VuIs1@dicehack.fztdmtj.mongodb.net/?retryWrites=true&w=majority&appName=DiceHack";

import cors from "cors";
import fs from "fs";
import path from "path";
let i = 0;
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

let globalData = [
  {
    bgRemLinks: [],
  },
];
// harshit gay hai 
cloudinary.config({
  cloud_name: "drsgwyrae",
  api_key: "931313911945979",
  api_secret: "fMn0tfbPEP1vlq6A1WAoHqGLybg",
});

const uploadToCloudinary = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath);
    console.log(result.secure_url);
    console.log("edher hia");
    return result.secure_url;
  } catch (error) {
    console.error(error);
    return null; // Return null or handle the error as needed
  }
};
/* 
cloudinary links
  data = [
    {
      imageLink: 'https://res.cloudinary.com/drsgwyrae/image/upload/v1710835343/lab_rat_2.jpg'
    },
    {
      imageLink: 'link'
    },{
      imageLink: 'link'
    },
  ]
*/

app.post("/saveto", async (req, res) => {
  const dataa = req.body;
  console.log(dataa);
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();

  await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
  const collectionName = "DiceHack"; // Replace with your desired collection name
  const db = client.db("hacker");
  const result = await db.collection(collectionName).insertOne(dataa);
  console.log("Data inserted successfully:", result.insertedId);
  const csv = `${dataa.data.productName},${dataa.data.productCategory},${dataa.data.productDescription},${dataa.data.productImage},${dataa.data.lifestyleImage}\n`;
  try {
    appendFileSync("./results.csv", csv); // Append the CSV row to the file
  } catch (error) {
    console.log(error);
  }

  res.sendFile(path.join(process.cwd(), "results.csv"));
  // res.json({ message: "Data inserted successfully" });
});
app.get("/fetch", async (req, res) => {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();

  await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
  const collectionName = "DiceHack"; // Replace with your desired collection name
  const db = client.db("hacker");
  const data = await db.collection(collectionName).find().toArray();
  console.log("Fetched data:", data);
  res.json(data);
});

app.post("/process-images", async (req, res) => {
  let linksArray = req.body.data;

  try {
    for (const link_object of linksArray) {
      const imagePath = await removeDaBg(link_object.imageLink);
      if (imagePath) {
        const cloudinaryUrl = await uploadToCloudinary(imagePath);
        if (cloudinaryUrl) {
          globalData[0].bgRemLinks.push(cloudinaryUrl);
        }
      }
    }
    console.log(globalData[0].bgRemLinks[i]);
    const productimage = globalData[0].bgRemLinks[i];
    const imageClassification = await about_gen(globalData[0].bgRemLinks[i]);

    console.log(imageClassification);
    i++;
    const jsonResponse = JSON.parse(
      imageClassification.message.content.match(/```json\n([\s\S]*)\n```/)[1]
    );
    console.log(jsonResponse);
    // Extract the product name and category
    const productName = jsonResponse.name;
    const productCategory = jsonResponse.category;
    const productDEsc = jsonResponse.description;

    const Lifeimg = await lifestyleimg(productimage, productName);
    console.log(Lifeimg);

    const responseJson = {
      productName: productName,
      productCategory: productCategory,
      productDescription: productDEsc,
      productImage: productimage,
      lifestyleImage: Lifeimg,
    };
    res.json(responseJson);
    console.log("yes bro its done");
  } catch (err) {
    console.log(err);
  }
});
app.post("/image", async (req, res) => {
  let linksArray = req.body.data;

  try {
    for (const link_object of linksArray) {
      const imagePath = await removeDaBg(link_object.imageLink);
      if (imagePath) {
        const cloudinaryUrl = await uploadToCloudinary(imagePath);
        if (cloudinaryUrl) {
          globalData[0].bgRemLinks.push(cloudinaryUrl);
        }
      }
    }
    // console.log(globalData[0].bgRemLinks);
    const productimage = globalData[0].bgRemLinks[i];
    const imageClassification = await about_gen(globalData[0].bgRemLinks[i]);
    i++;
    console.log(imageClassification);
    const jsonResponse = JSON.parse(
      imageClassification.message.content.match(/```json\n([\s\S]*)\n```/)[1]
    );
    console.log(jsonResponse);

    const productName = jsonResponse.name;
    const productCategory = jsonResponse.category;
    const productDEsc = jsonResponse.description;
    console.log(productimage);

    const responseJson = {
      productName: productName,
      productCategory: productCategory,
      productDescription: productDEsc,
      productImage: productimage,
    };
    res.json(responseJson);
    console.log("yes bro its done");
  } catch (err) {
    console.log(err);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
