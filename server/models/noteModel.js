const connectDB = require('../db');

const formatNote = (row) => {
  if (!row) {
    return null;
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    title: row.title,
    subject: row.subject,
    semester: row.semester,
    type: row.type,
    fileUrl: row.file_url,
    cloudinaryUrl: row.cloudinary_url,
    localFilename: row.local_filename,
    uploadedBy: row.uploaded_by,
    uploadedByEmail: row.uploaded_by_email,
    downloads: row.downloads,
    createdAt: row.created_at
  };
};

const getAllNotes = ({ sort = 'latest', limit } = {}) => {
  const db = connectDB();
  let orderBy = 'created_at DESC';

  if (sort === 'downloads') {
    orderBy = 'downloads DESC';
  }

  let sql = `SELECT * FROM notes ORDER BY ${orderBy}`;
  const params = [];

  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
  }

  const rows = db.prepare(sql).all(...params);
  return rows.map(formatNote);
};

const getNoteById = (id) => {
  const db = connectDB();
  const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(Number(id));
  return formatNote(row);
};

const createNote = ({
  title,
  subject,
  semester,
  type,
  fileUrl,
  cloudinaryUrl = '',
  localFilename = '',
  uploadedBy,
  uploadedByEmail,
  downloads = 0
}) => {
  const db = connectDB();
  const result = db
    .prepare(`
      INSERT INTO notes (
        title, subject, semester, type, file_url, cloudinary_url, local_filename,
        uploaded_by, uploaded_by_email, downloads
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      title,
      subject,
      semester,
      type,
      fileUrl,
      cloudinaryUrl,
      localFilename,
      uploadedBy,
      uploadedByEmail.toLowerCase(),
      downloads
    );

  return getNoteById(result.lastInsertRowid);
};

const searchNotes = (query) => {
  const db = connectDB();
  const pattern = `%${query}%`;
  const rows = db
    .prepare(`
      SELECT * FROM notes
      WHERE title LIKE ? COLLATE NOCASE OR subject LIKE ? COLLATE NOCASE
      ORDER BY created_at DESC
    `)
    .all(pattern, pattern);

  return rows.map(formatNote);
};

const getNotesBySemester = (semester) => {
  const db = connectDB();
  const rows = db
    .prepare('SELECT * FROM notes WHERE semester = ? ORDER BY created_at DESC')
    .all(semester);

  return rows.map(formatNote);
};

const getNotesByUploaderEmail = (email) => {
  const db = connectDB();
  const rows = db
    .prepare('SELECT * FROM notes WHERE uploaded_by_email = ? ORDER BY created_at DESC')
    .all(email.toLowerCase());

  return rows.map(formatNote);
};

const incrementNoteDownloads = (id) => {
  const db = connectDB();
  db.prepare('UPDATE notes SET downloads = downloads + 1 WHERE id = ?').run(Number(id));
  return getNoteById(id);
};

const deleteNoteById = (id) => {
  const db = connectDB();
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(Number(id));
  return result.changes > 0;
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  searchNotes,
  getNotesBySemester,
  getNotesByUploaderEmail,
  incrementNoteDownloads,
  deleteNoteById
};
