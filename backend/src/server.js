require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Keycloak OAuth routes
app.get('/protocol/openid-connect/auth', async (req, res) => {
  try {
    // TODO: Implement Concept2 OAuth authorization URL construction
    // This endpoint will be called by Supabase's Keycloak provider
    const concept2AuthUrl = 'https://log.concept2.com/oauth/authorize'; // Need to confirm this URL
    // Add necessary OAuth parameters
    res.redirect(concept2AuthUrl);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.post('/protocol/openid-connect/token', async (req, res) => {
  try {
    // TODO: Implement token exchange with Concept2
    // This endpoint will be called by Supabase to exchange the auth code for tokens
    res.json({
      access_token: 'TODO',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'TODO'
    });
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

app.get('/protocol/openid-connect/userinfo', async (req, res) => {
  try {
    // TODO: Implement user info fetching from Concept2
    // This endpoint will be called by Supabase to get user information
    res.json({
      sub: 'TODO',
      email: 'TODO',
      email_verified: true,
      name: 'TODO'
    });
  } catch (error) {
    console.error('User info error:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 