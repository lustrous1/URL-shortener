// index.js

const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB connection (replace with your own MongoDB URI in Render env)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Mongoose Schema
const UrlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true, unique: true },
  date_created: { type: Date, default: Date.now }
});

const Url = mongoose.model('Url', UrlSchema);

// Shorten URL Route
app.post('/shorten', async (req, res) => {
  const { original_url } = req.body;
  if (!original_url) {
    return res.status(400).json({ error: 'Missing original_url' });
  }

  let existing = await Url.findOne({ original_url });
  if (existing) {
    return res.json({
      original_url: existing.original_url,
      short_url: req.protocol + '://' + req.get('host') + '/' + existing.short_url
    });
  }

  const short_url = shortid.generate();
  const newUrl = new Url({ original_url, short_url });
  await newUrl.save();

  res.json({
    original_url,
    short_url: req.protocol + '://' + req.get('host') + '/' + short_url
  });
});

// Redirect Route
app.get('/:short_url', async (req, res) => {
  const { short_url } = req.params;
  const url = await Url.findOne({ short_url });
  if (url) {
    return res.redirect(url.original_url);
  }
  res.status(404).json({ error: 'URL not found' });
});

// Get all URLs Route
app.get('/urls', async (req, res) => {
  const urls = await Url.find();
  const result = urls.map(url => ({
    original_url: url.original_url,
    short_url: req.protocol + '://' + req.get('host') + '/' + url.short_url,
    date_created: url.date_created
  }));
  res.json(result);
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
