import express from 'express';
import cors from 'cors';
// We'll use node-fetch for making a request to an external image API for simplicity
// Make sure to install it: npm install node-fetch
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.ANIME_API_PORT || 8080; // Port for this anime API server

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server default
    'http://localhost:3000', // Common React dev server port
    // Add your deployed frontend URL here for production, e.g., 'https://your-frontend.com'
  ];
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'], // Add methods your API uses
    allowedHeaders: ['Content-Type', 'Authorization'], // Add headers your API expects
  };
  
  app.use(cors(corsOptions));

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for simplicity in development
app.use(express.json());

// --- Mock Data & Logic ---
// This is a simplified mock. The actual AnimeAvatar backend likely has more complex logic.

const mockAnimeList = {
  animeList: [
    { value: 'Naruto_Shippuuden', label: 'Naruto Shippuuden' },
    { value: 'One_Piece', label: 'One Piece' },
    { value: 'Attack_on_Titan', label: 'Attack on Titan' },
    { value: 'Demon_Slayer', label: 'Demon Slayer' },
    { value: 'Jujutsu_Kaisen', label: 'Jujutsu Kaisen' },
  ],
  numberOfAnime: 5,
};

// Function to get an avatar image URL
// The AnimeAvatar README says "/api/avatar ... will return image for you."
// This means the endpoint itself should serve the image data or redirect to an image.
// For this mock, we'll fetch a random anime image URL from an external API and redirect.
const getAvatarImage = async (req, res) => {
  const { _name, _gender, _animeName } = req.query;
  console.log(`[Anime API Server] Avatar requested with params: name=${_name}, gender=${_gender}, anime=${_animeName}`);

  try {
    // Using waifu.pics API as an example to get a random SFW waifu image URL
    // Refer to their documentation for more options or alternatives.
    const externalApiResponse = await fetch('https://api.waifu.pics/sfw/waifu');
    if (!externalApiResponse.ok) {
      throw new Error(`External API failed with status: ${externalApiResponse.status}`);
    }
    const imageData = await externalApiResponse.json();

    if (imageData && imageData.url) {
      console.log(`[Anime API Server] Redirecting to image: ${imageData.url}`);
      // Redirect the client's browser to the actual image URL
      res.redirect(302, imageData.url);
    } else {
      console.error('[Anime API Server] External API did not return a valid image URL.');
      res.status(500).send('Could not retrieve an avatar image.');
    }
  } catch (error) {
    console.error('[Anime API Server] Error fetching/redirecting to avatar:', error);
    res.status(500).send('Error processing avatar request.');
  }
};

// --- API Routes (matching your AnimeAvatar README) ---

// GET /api/avatar?name=${_name}&gender=${_gender}&animeName=${_anime}
app.get('/api/avatar', getAvatarImage);

// GET /api/animelist/
app.get('/api/animelist', (req, res) => {
  console.log('[Anime API Server] Anime list requested');
  res.json(mockAnimeList);
});

// Basic root route for testing
app.get('/', (req, res) => {
  res.send('Mock Anime API Server is running!');
});

app.listen(PORT, () => {
  console.log(`🎉 Mock Anime API Server listening on http://localhost:${PORT}`);
  console.log(`   Avatar endpoint: http://localhost:${PORT}/api/avatar`);
  console.log(`   Anime list endpoint: http://localhost:${PORT}/api/animelist`);
});
