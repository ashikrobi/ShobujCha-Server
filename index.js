//middleware imports
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();


//variables for express
const express = require('express')
const app = express()
const fs = require('fs-extra')
const port = 5000
//variables for mongodb
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.73puo.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//use middleware
app.use(cors());
app.use(express.json());
app.use(express.static('variants'));
app.use(fileUpload());

//configure server with express
app.get('/', (req, res) => {
  res.send('Server ShobujCha!')
})

app.listen(process.env.PORT || port, () => {
  console.log(`ShobujCha Server Listening at http://localhost:${port}`)
})

//connect to mongodb
client.connect(err => {
  const teaCollection = client.db("shobujCha").collection("teaVariant");
  console.log('connection to db successful')
  
//post data to mongodb
  app.post('/addTeaVariant', (req, res) => {
    const file = req.files.file;
    const variant = req.body.variant;
    const price = req.body.price;
    console.log(variant, price, file);
    const filePath = `${__dirname}/variants/${file.name}`;
    file.mv(filePath, error => {
      if (err) {
        console.log(err);
        res.status(500).send({ msg: 'Failed to upload image' });
      }
      const newImg = fs.readFileSync(filePath);
      const encImg = newImg.toString('base64');
      
      const image = {
        contentType: req.files.file.mimetype,
        size: req.files.file.size,
        img: Buffer.from(encImg, 'base64')
      };
      teaCollection.insertOne({variant, price, image})
        .then(result => {
          fs.remove(filePath, error => {
            if (error) {
              console.log(error)
              res.status(500).send({ msg: 'Failed to upload image' });
            }
            res.send(result.insertedCount > 0)
          })
      })
    });
  })

  
//read data from mongodb
  app.get('/teaCollection', (req, res) => {
    teaCollection.find({})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })

});
