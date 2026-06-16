const Note = require('../models/noteModel');
const User = require('../models/userModel');
const { isAdminUser } = require('../middleware/adminMiddleware');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const uploadsDir = path.join(__dirname, '../uploads');
const isServerless = Boolean(process.env.VERCEL);

const uploadBufferToCloudinary = (buffer, originalname) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'campus_notes',
        use_filename: true,
        unique_filename: true,
        access_mode: 'public',
        filename_override: originalname
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );

    Readable.from(buffer).pipe(uploadStream);
  });

const saveBufferLocally = (buffer, originalname) => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const localFilename = `pdf-${uniqueSuffix}${path.extname(originalname) || '.pdf'}`;
  const localFilePath = path.join(uploadsDir, localFilename);
  fs.writeFileSync(localFilePath, buffer);
  return localFilename;
};

exports.getNotes = async (req, res) => {
  try {
    const { sort, limit } = req.query;
    const notes = Note.getAllNotes({ sort, limit });
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Error fetching notes.', error: error.message });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = Note.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }
    res.status(200).json(note);
  } catch (error) {
    console.error('Error fetching note by ID:', error);
    res.status(500).json({ message: 'Error retrieving the note.', error: error.message });
  }
};

exports.uploadNote = async (req, res) => {
  try {
    const { title, subject, semester, type } = req.body;

    if (!title || !subject || !semester || !type) {
      return res.status(400).json({ message: 'All fields (title, subject, semester, type) are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file.' });
    }

    let fileUrl = '';
    let cloudinaryUrl = '';
    let localFilename = '';

    if (isCloudinaryConfigured) {
      try {
        const result = await uploadBufferToCloudinary(req.file.buffer, req.file.originalname);
        cloudinaryUrl = result.secure_url;
        fileUrl = cloudinaryUrl;
      } catch (cloudinaryErr) {
        console.error('Cloudinary upload failed:', cloudinaryErr);
        if (isServerless) {
          return res.status(503).json({
            message: 'File upload failed. Please verify Cloudinary credentials in your deployment settings.'
          });
        }
      }
    }

    if (!cloudinaryUrl && !isServerless) {
      localFilename = saveBufferLocally(req.file.buffer, req.file.originalname);
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${localFilename}`;
    }

    if (!fileUrl) {
      return res.status(503).json({
        message: 'File storage is not configured. Add Cloudinary environment variables before uploading on Vercel.'
      });
    }

    const newNote = Note.createNote({
      title,
      subject,
      semester,
      type,
      fileUrl,
      cloudinaryUrl,
      localFilename,
      uploadedBy: req.user.name,
      uploadedByEmail: req.user.email,
      downloads: 0
    });

    res.status(201).json({
      message: 'Note uploaded successfully!',
      note: newNote
    });
  } catch (error) {
    console.error('Error uploading note:', error);
    res.status(500).json({ message: 'Server error during note upload.', error: error.message });
  }
};

exports.getMyNotes = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const notes = Note.getNotesByUploaderEmail(req.user.email);
    const totalDownloads = notes.reduce((sum, note) => sum + note.downloads, 0);

    res.status(200).json({
      notes,
      stats: {
        totalUploads: notes.length,
        totalDownloads
      }
    });
  } catch (error) {
    console.error('Error fetching user notes:', error);
    res.status(500).json({ message: 'Error fetching your documents.', error: error.message });
  }
};

exports.searchNotes = async (req, res) => {
  try {
    const query = req.query.q || '';
    const notes = Note.searchNotes(query);
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ message: 'Error searching notes.', error: error.message });
  }
};

exports.getNotesBySemester = async (req, res) => {
  try {
    const semester = req.params.sem;
    const allowedSemesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

    if (!allowedSemesters.includes(semester)) {
      return res.status(400).json({ message: 'Invalid semester. Allowed semesters are 1st to 8th.' });
    }

    const notes = Note.getNotesBySemester(semester);
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes by semester:', error);
    res.status(500).json({ message: 'Error fetching notes for the specified semester.', error: error.message });
  }
};

exports.incrementDownloads = async (req, res) => {
  try {
    const note = Note.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const user = User.findUserById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: 'User profile not found. Please log in again.' });
    }

    const userPlan = user.plan === 'Free' ? 'Basic' : user.plan;

    if (userPlan === 'Basic' && user.downloadsCount >= 2) {
      return res.status(403).json({
        message: 'Download Limit Reached! Basic plan accounts are limited to 2 document downloads.',
        limitExceeded: true,
        plan: 'Basic',
        maxAllowed: 2
      });
    }

    if (userPlan === 'Pro' && user.downloadsCount >= 5) {
      return res.status(403).json({
        message: 'Download Limit Reached! Pro plan accounts are limited to 5 document downloads.',
        limitExceeded: true,
        plan: 'Pro',
        maxAllowed: 5
      });
    }

    const updatedUser = User.updateUser(req.user.id, {
      downloadsCount: user.downloadsCount + 1
    });

    const updatedNote = Note.incrementNoteDownloads(req.params.id);

    res.status(200).json({
      downloads: updatedNote.downloads,
      downloadsCount: updatedUser.downloadsCount,
      fileUrl: `/api/notes/${updatedNote._id}/file`
    });
  } catch (error) {
    console.error('Error incrementing download count:', error);
    res.status(500).json({ message: 'Error updating download count.', error: error.message });
  }
};

exports.serveNoteFile = async (req, res) => {
  try {
    const note = Note.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    const safeTitle = (note.title || 'document').replace(/[^\w\s.-]/g, '').trim() || 'document';

    if (!isServerless) {
      const filename = note.localFilename || (note.fileUrl.includes('/uploads/') ? note.fileUrl.split('/uploads/')[1] : '');
      if (filename) {
        const localFilePath = path.join(uploadsDir, filename);
        if (fs.existsSync(localFilePath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.pdf"`);
          return fs.createReadStream(localFilePath).pipe(res);
        }
      }
    }

    const remoteUrl = note.cloudinaryUrl || (note.fileUrl.includes('cloudinary.com') ? note.fileUrl : '');
    if (remoteUrl) {
      const response = await fetch(remoteUrl);
      if (response.ok) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.pdf"`);
        const buffer = Buffer.from(await response.arrayBuffer());
        return res.send(buffer);
      }
    }

    return res.status(404).json({
      message: 'File not found on server. Please re-upload this document.'
    });
  } catch (error) {
    console.error('Error serving note file:', error);
    res.status(500).json({ message: 'Error serving document file.', error: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const note = Note.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    if (note.cloudinaryUrl && isCloudinaryConfigured) {
      try {
        const publicId = note.cloudinaryUrl.split('/upload/')[1]?.replace(/^v\d+\//, '').replace(/\.pdf$/i, '');
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }
      } catch (cloudinaryErr) {
        console.error('Cloudinary delete failed:', cloudinaryErr);
      }
    }

    if (note.localFilename || note.fileUrl.includes('/uploads/')) {
      const filename = note.localFilename || note.fileUrl.split('/uploads/')[1];
      const localFilePath = path.join(uploadsDir, filename);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }

    Note.deleteNoteById(req.params.id);
    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteNote controller:', error);
    res.status(500).json({ message: 'Error deleting document.', error: error.message });
  }
};
