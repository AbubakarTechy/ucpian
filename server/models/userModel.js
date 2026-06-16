const connectDB = require('../db');

const formatUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    name: row.name,
    email: row.email,
    password: row.password,
    googleId: row.google_id,
    authProvider: row.auth_provider,
    profilePic: row.profile_pic,
    plan: row.plan,
    downloadsCount: row.downloads_count,
    createdAt: row.created_at,
    role: 'user'
  };
};

const findUserByEmail = (email, includePassword = false) => {
  const db = connectDB();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  const user = formatUser(row);

  if (user && !includePassword) {
    delete user.password;
  }

  return user;
};

const findUserById = (id) => {
  const db = connectDB();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id));
  const user = formatUser(row);

  if (user) {
    delete user.password;
  }

  return user;
};

const findUserByGoogleIdOrEmail = (googleId, email) => {
  const db = connectDB();
  const row = db
    .prepare('SELECT * FROM users WHERE google_id = ? OR email = ?')
    .get(googleId, email.toLowerCase());

  const user = formatUser(row);
  if (user) {
    delete user.password;
  }

  return user;
};

const createUser = ({
  name,
  email,
  password = null,
  googleId = null,
  authProvider = 'local',
  profilePic = '',
  plan = 'Basic',
  downloadsCount = 0
}) => {
  const db = connectDB();
  const result = db
    .prepare(`
      INSERT INTO users (name, email, password, google_id, auth_provider, profile_pic, plan, downloads_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      name.trim(),
      email.toLowerCase().trim(),
      password,
      googleId,
      authProvider,
      profilePic,
      plan,
      downloadsCount
    );

  return findUserById(result.lastInsertRowid);
};

const updateUser = (id, fields) => {
  const db = connectDB();
  const allowedFields = {
    name: 'name',
    email: 'email',
    password: 'password',
    googleId: 'google_id',
    authProvider: 'auth_provider',
    profilePic: 'profile_pic',
    plan: 'plan',
    downloadsCount: 'downloads_count'
  };

  const updates = [];
  const values = [];

  Object.entries(fields).forEach(([key, value]) => {
    const column = allowedFields[key];
    if (column !== undefined) {
      updates.push(`${column} = ?`);
      values.push(value);
    }
  });

  if (updates.length === 0) {
    return findUserById(id);
  }

  values.push(Number(id));
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return findUserById(id);
};

const getAllUsers = () => {
  const db = connectDB();
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  return rows.map((row) => {
    const user = formatUser(row);
    delete user.password;
    return user;
  });
};

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByGoogleIdOrEmail,
  createUser,
  updateUser,
  getAllUsers
};
