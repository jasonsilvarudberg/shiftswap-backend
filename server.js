const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

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

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',  // Replace with your email
    pass: 'your-email-password'    // Replace with your email password
  }
});

// Define Schema and Model
const residentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  year: { type: String, required: true },
  datesSeeking: { type: [String], required: true },
  datesAvailable: { type: [String], required: true },
});

const Resident = mongoose.model('Resident', residentSchema);

// Routes
app.post('/residents', async (req, res) => {
  try {
    const { name, email, year, datesSeeking, datesAvailable } = req.body;
    console.log('Request Body:', req.body);
    
    if (!name || !email || !year || !Array.isArray(datesSeeking) || !Array.isArray(datesAvailable)) {
      return res.status(400).send({ error: 'Bad Request', message: 'All fields are required and must be correctly formatted.' });
    }
    
    const resident = new Resident({ name, email, year, datesSeeking, datesAvailable });
    await resident.save();
    res.status(201).send(resident);
    
    // Check for matches and send emails if necessary
    const residents = await Resident.find();
    let match = null;
    for (let res of residents) {
      if (res._id !== resident._id) {
        const seekingOverlap = datesSeeking.some(date => res.datesAvailable.includes(date));
        const availableOverlap = datesAvailable.some(date => res.datesSeeking.includes(date));
        if (seekingOverlap && availableOverlap) {
          match = res;
          break;
        }
      }
    }
    
    if (match) {
      const matchMessage = `Match found with ${match.name} (${match.year})! Dates you can cover for them: ${datesAvailable.filter(date => match.datesSeeking.includes(date)).join(', ')}. Dates they can cover for you: ${datesSeeking.filter(date => match.datesAvailable.includes(date)).join(', ')}`;
      await sendEmail(resident.email, matchMessage);
      await sendEmail(match.email, matchMessage);
    }
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

app.delete('/residents', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).send({ error: 'Bad Request', message: 'Name is required' });
    }
    const result = await Resident.deleteMany({ name });
    res.status(200).send({ message: 'Entries deleted', result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'Internal Server Error', message: error.message });
  }
});

app.post('/send-email', async (req, res) => {
  const { email, message } = req.body;
  const mailOptions = {
    from: 'your-email@gmail.com', // Replace with your email
    to: email,
    subject: 'Shift Swap Match',
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send({ error: 'Internal Server Error', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

async function sendEmail(email, message) {
  const mailOptions = {
    from: 'your-email@gmail.com', // Replace with your email
    to: email,
    subject: 'Shift Swap Match',
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
