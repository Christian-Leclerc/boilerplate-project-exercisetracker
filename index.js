const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true })
const connection = mongoose.connection
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("MongoDB database connection establishes successfully");
})

//Schemas
const UserSchema = new mongoose.Schema({
  username: {
    type: String, 
    unique: true, 
    required: [true, "You need a name!"]
  }
},
{ versionKey: false }
);
const User = mongoose.model('User', UserSchema);



app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

//Post username
app.route('/api/users')
.get(async (req, res) => {
  try {
    const users = await User.find({}).select('_id username');
    if (!users) {
      return res.json("No users in database")
    } else {
      return res.json(users);
    }
  } catch(err) {
    res.send(err);
  }
})
.post(async (req, res) => {
  const username = req.body.username
  try{
    const userFound = await User.findOne({username})
    if (userFound) {
      console.log(userFound);
      return res.json(userFound);
    } else {
      const user = await User.create({
        username
      })
      res.json(user);
    }
  } catch(err) {
    console.log(err);
    res.json({error: "You need to input a name"})
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


