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

const ExerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
}, 
{ versionKey: false }
);
const Exercise = mongoose.model('Exercise', ExerciseSchema);


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

//Post exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  let {description, duration, date}  = req.body;
  //Date validation
  if (date === "") {
    date = new Date();
  } else {
    const checkDate = new Date(date);
    if (isNaN(checkDate.getTime())) {
      return res.json({error: "Invalid Date format: YYYY-MM-DD"})
    } else {
      date = checkDate;
    }
  }
  //Description validation
  if (description === "" || !isNaN(+description)) {
    return res.json({error: "You must input a valid description name!"})
  }
  //Duration validation
  if (duration === "" || isNaN(+duration)) {
    return res.json({error: "You must input an integer!"})
  }
  try {
    const userFound = await User.findById(id);
    if (!userFound) {
      console.log(id);
      return res.send("This user ID doesn't exits")
    } else {
      const exercise = await Exercise.create({
        username: userFound.username,
        description,
        duration,
        date,
        user_id: userFound._id
      })

      return res.json({
        username: exercise.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
        _id: exercise._id
      });
    }
  } catch(err) {
    console.log(err);
    return res.json({error: "You must input a valid ID (a string of 12 bytes or a string of 24 hex characters)"});
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


