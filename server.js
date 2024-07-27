const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
const mongoURI = 'mongodb+srv://jasonantoniosilva2:ic1azdoNT6caAEsF@cluster0.pkxaae9.mongodb.net/resident-shift-swap?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsInsecure: false,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Define Schema and Model
const residentSchema = new mongoose.Schema({
  name: String,
  year: String,
  datesSeeking: [String],
  datesAvailable: [String],
});

const Resident = mongoose.model('Resident', residentSchema);

// Routes
app.post('/residents', async (req, res) => {
  const resident = new Resident(req.body);
  await resident.save();
  res.send(resident);
});

app.get('/residents', async (req, res) => {
  const residents = await Resident.find();
  res.send(residents);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
