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
  name: { type: String, required: true },
  year: { type: String, required: true },
  datesSeeking: { type: [String], required: true },
  datesAvailable: { type: [String], required: true },
});

const Resident = mongoose.model('Resident', residentSchema);

// Routes
app.post('/residents', async (req, res) => {
  try {
    const { name, year, datesSeeking, datesAvailable } = req.body;
    console.log('Request Body:', req.body);
    
    if (!name || !year || !Array.isArray(datesSeeking) || !Array.isArray(datesAvailable)) {
      return res.status(400).send({ error: 'Bad Request', message: 'All fields are required and must be correctly formatted.' });
    }
    
    const resident = new Resident({ name, year, datesSeeking, datesAvailable });
    await resident.save();
    res.status(201).send(resident);
  } catch (error) {
    console.error('Error:', error);
    res.status(400).send({ error: 'Bad Request', message: error.message });
  }
});

app.get('/residents', async (req, res) => {
  try {
    const residents = await Resident.find();
    res.status(200).send(residents);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
