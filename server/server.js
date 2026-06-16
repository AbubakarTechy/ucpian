require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  if (!process.env.VERCEL) {
    console.log(`Local PDF uploads served at http://localhost:${PORT}/uploads/`);
  }
});
