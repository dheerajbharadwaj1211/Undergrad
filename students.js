// routes/students.js
const express = require('express');
const { db } = require('../firebase-admin');
const { authenticateToken } = require('./auth');
const router = express.Router();

// GET all students - protected route
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching students for user:', req.user.email); // Debug log
    
    const studentsSnapshot = await db.collection('students').get();
    const students = [];
    
    studentsSnapshot.forEach(doc => {
      students.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${students.length} students`); // Debug log
    
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students'
    });
  }
});

// POST create new student - protected route
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating student by user:', req.user.email); // Debug log
    
    const studentData = {
      ...req.body,
      createdBy: req.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await db.collection('students').add(studentData);
    
    console.log('Student created with ID:', docRef.id); // Debug log
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      id: docRef.id,
      data: { id: docRef.id, ...studentData }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create student'
    });
  }
});

// GET single student - protected route
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`Fetching student ${req.params.id} for user:`, req.user.email); // Debug log
    
    const doc = await db.collection('students').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student'
    });
  }
});

// PUT update student - protected route
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`Updating student ${req.params.id} by user:`, req.user.email); // Debug log
    
    const updateData = {
      ...req.body,
      updatedBy: req.user.email,
      updatedAt: new Date()
    };
    
    // Remove the id from update data if it exists
    delete updateData.id;
    
    await db.collection('students').doc(req.params.id).update(updateData);
    
    console.log('Student updated successfully'); // Debug log
    
    res.json({
      success: true,
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update student'
    });
  }
});

// DELETE student - protected route
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log(`Deleting student ${req.params.id} by user:`, req.user.email); // Debug log
    
    await db.collection('students').doc(req.params.id).delete();
    
    console.log('Student deleted successfully'); // Debug log
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete student'
    });
  }
});

// POST add communication to student - protected route
router.post('/:id/communications', authenticateToken, async (req, res) => {
  try {
    const { type, content } = req.body;
    const studentId = req.params.id;
    
    console.log(`Adding communication to student ${studentId}`); // Debug log
    
    const communicationData = {
      type,
      content,
      date: new Date().toISOString().split('T')[0],
      addedBy: req.user.email,
      timestamp: new Date()
    };
    
    // Add to communications subcollection
    await db.collection('students').doc(studentId)
             .collection('communications').add(communicationData);
    
    res.json({
      success: true,
      message: 'Communication logged successfully'
    });
  } catch (error) {
    console.error('Error adding communication:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log communication'
    });
  }
});

// POST add note to student - protected route
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const studentId = req.params.id;
    
    console.log(`Adding note to student ${studentId}`); // Debug log
    
    const noteData = {
      content,
      author: req.user.email,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date()
    };
    
    // Add to notes subcollection
    await db.collection('students').doc(studentId)
             .collection('notes').add(noteData);
    
    res.json({
      success: true,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note'
    });
  }
});

module.exports = router;