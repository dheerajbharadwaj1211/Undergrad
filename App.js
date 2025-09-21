import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Mail, Phone, Globe, Calendar, MessageSquare, Plus, Edit3, Trash2, Eye, Bell, BarChart3, LogOut } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import Login from './components/Login';
import './dashboard.css';
import studentData from './studentData.js';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Use the data from your local file - convert object to array
  const studentArray = Object.entries(studentData).map(([id, student]) => ({
    id,
    name: student.fullname,
    email: student.email,
    phone: student.phone,
    country: student.country,
    grade: student.grade,
    applicationStatus: student.applicationstatus,
    lastActive: "2025-09-15",
    aiQuestionsAsked: student.aiQuestionsasked,
    documentsSubmitted: 5,
    dreamUniversity: student.university,
    major: "Computer Science",
    gpa: student.GPA,
    satScore: student["SAT Score"],
    engagementScore: student["engagement score"],
    intent: student.risklevel === 'high' ? 'high' : student.risklevel === 'medium' ? 'interested' : 'exploring', // Convert risk to intent
    essays: {
      personal: "In Progress",
      supplemental: "Not Started"
    },
    communications: [],
    notes: []
  }));

  // Dashboard state
  const [students, setStudents] = useState(studentArray);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [newNote, setNewNote] = useState('');

  // Additional filters
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [intentFilter, setIntentFilter] = useState('All');
  const [lastActiveFilter, setLastActiveFilter] = useState('All');
  
  // Manual communication logging state
  const [showLogCommModal, setShowLogCommModal] = useState(false);
  const [commData, setCommData] = useState({
    type: 'phone',
    content: '',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    duration: '',
    outcome: ''
  });

  // Task/Reminder state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    assignedTo: 'Admin',
    type: 'reminder',
    status: 'pending'
  });

  // Tasks storage (in real app, this would be in database)
  const [tasks, setTasks] = useState([]);

  // Add Student Form state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    grade: '11th Grade',
    applicationStatus: 'Exploring',
    dreamUniversity: '',
    major: '',
    gpa: '',
    satScore: '',
    engagementScore: 50,
    intent: 'interested'
  });

  // Authentication functions
  const handleLogin = (userData, token) => {
    setUser(userData);
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  // Check for existing auth on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setAuthToken(token);
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  // Authentication check
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Filter students based on search and all filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || student.applicationStatus === statusFilter;
    const matchesIntent = intentFilter === 'All' || student.intent === intentFilter;
    
    // Check last active filter
    let matchesLastActive = true;
    if (lastActiveFilter === 'Before7Days') {
      const lastActiveDate = new Date(student.lastActive);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesLastActive = lastActiveDate < sevenDaysAgo;
    }
    
    return matchesSearch && matchesStatus && matchesIntent && matchesLastActive;
  });

  // Get summary statistics
  const stats = {
    total: students.length,
    exploring: students.filter(s => s.applicationStatus === 'Exploring').length,
    shortlisting: students.filter(s => s.applicationStatus === 'Shortlisting').length,
    applying: students.filter(s => s.applicationStatus === 'Applying').length,
    submitted: students.filter(s => s.applicationStatus === 'Submitted').length,
    highIntent: students.filter(s => s.intent === 'high').length,
    needsContact: students.filter(s => {
      const lastActiveDate = new Date(s.lastActive);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastActiveDate < weekAgo;
    }).length
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Exploring': return 'status-exploring';
      case 'Shortlisting': return 'status-shortlisting';
      case 'Applying': return 'status-applying';
      case 'Submitted': return 'status-submitted';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (intent) => {
    switch(intent) {
      case 'exploring': return 'text-blue-600';
      case 'interested': return 'text-yellow-600';
      case 'high': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const addNote = () => {
    if (newNote.trim() && selectedStudent) {
      const updatedStudents = students.map(student => {
        if (student.id === selectedStudent.id) {
          return {
            ...student,
            notes: [
              ...student.notes,
              {
                date: new Date().toISOString().split('T')[0],
                author: 'Admin',
                content: newNote
              }
            ]
          };
        }
        return student;
      });
      setStudents(updatedStudents);
      setSelectedStudent({
        ...selectedStudent,
        notes: [
          ...selectedStudent.notes,
          {
            date: new Date().toISOString().split('T')[0],
            author: 'Admin',
            content: newNote
          }
        ]
      });
      setNewNote('');
      setShowModal(false);
    }
  };

  const logCommunication = (type, content, date = null, status = 'sent', duration = '', outcome = '') => {
    if (selectedStudent) {
      const newComm = {
        type,
        date: date || new Date().toISOString().split('T')[0],
        content,
        status,
        duration,
        outcome,
        loggedBy: 'Admin',
        loggedAt: new Date().toISOString()
      };
      
      const updatedStudents = students.map(student => {
        if (student.id === selectedStudent.id) {
          return {
            ...student,
            communications: [...student.communications, newComm]
          };
        }
        return student;
      });
      
      setStudents(updatedStudents);
      setSelectedStudent({
        ...selectedStudent,
        communications: [...selectedStudent.communications, newComm]
      });
    }
  };

  const handleLogCommunication = () => {
    if (commData.content.trim()) {
      logCommunication(
        commData.type, 
        commData.content, 
        commData.date, 
        commData.status,
        commData.duration,
        commData.outcome
      );
      
      // Reset form
      setCommData({
        type: 'phone',
        content: '',
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        duration: '',
        outcome: ''
      });
      setShowLogCommModal(false);
    }
  };

  const handleCreateTask = () => {
    if (taskData.title.trim() && taskData.dueDate) {
      const newTask = {
        id: Date.now().toString(),
        ...taskData,
        studentId: selectedStudent?.id,
        studentName: selectedStudent?.name,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
      };

      setTasks(prevTasks => [...prevTasks, newTask]);

      // Reset form
      setTaskData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'medium',
        assignedTo: 'Admin',
        type: 'reminder',
        status: 'pending'
      });
      setShowTaskModal(false);
      alert('Task/Reminder created successfully!');
    }
  };

  const markTaskComplete = (taskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', completedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const getTasksForStudent = (studentId) => {
    return tasks.filter(task => task.studentId === studentId && task.status !== 'completed');
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return task.status === 'pending' && dueDate <= nextWeek;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  const createTestStudent = () => {
    setShowAddStudentModal(true);
  };

  const handleAddStudent = async () => {
    try {
      if (!newStudentData.name || !newStudentData.email || !newStudentData.phone || !newStudentData.country) {
        alert('Please fill in all required fields');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newStudentData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      const studentToAdd = {
        name: newStudentData.name,
        email: newStudentData.email,
        phone: newStudentData.phone,
        country: newStudentData.country,
        grade: newStudentData.grade,
        applicationStatus: newStudentData.applicationStatus,
        lastActive: new Date().toISOString().split('T')[0],
        aiQuestionsAsked: 0,
        documentsSubmitted: 0,
        dreamUniversity: newStudentData.dreamUniversity || 'Not specified',
        major: newStudentData.major || 'Undecided',
        gpa: parseFloat(newStudentData.gpa) || 0,
        satScore: parseInt(newStudentData.satScore) || 0,
        engagementScore: newStudentData.engagementScore,
        intent: newStudentData.intent,
        essays: {
          personal: "Not Started",
          supplemental: "Not Started"
        },
        communications: [],
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'students'), studentToAdd);
      
      const newStudent = {
        id: docRef.id,
        ...studentToAdd
      };
      
      setStudents(prevStudents => [...prevStudents, newStudent]);
      
      setNewStudentData({
        name: '',
        email: '',
        phone: '',
        country: '',
        grade: '11th Grade',
        applicationStatus: 'Exploring',
        dreamUniversity: '',
        major: '',
        gpa: '',
        satScore: '',
        engagementScore: 50,
        intent: 'interested'
      });
      setShowAddStudentModal(false);
      
      alert('Student added successfully!');
      
    } catch (error) {
      console.error('Error adding student: ', error);
      alert('Error adding student: ' + error.message);
    }
  };

  const handleInputChange = (field, value) => {
    setNewStudentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadStudentsFromFirebase = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const firebaseStudents = [];
      
      querySnapshot.forEach((doc) => {
        firebaseStudents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setStudents(firebaseStudents);
      alert(`Loaded ${firebaseStudents.length} students from Firebase!`);
    } catch (error) {
      console.error('Error loading students: ', error);
      alert('Error loading students: ' + error.message);
    }
  };

  // If a student is selected, show their profile
  if (selectedStudent) {
    return (
      <div className="profile-container">
  {/* Header */}
  <div className="profile-header">
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedStudent(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateX(-4px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateX(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            ← Back to Directory
          </button>
          <h1 className="text-2xl font-bold text-white">{selectedStudent.name}</h1>
          <span className={`status-badge ${getStatusColor(selectedStudent.applicationStatus)}`}>
            {selectedStudent.applicationStatus}
          </span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {setModalType('email'); setShowModal(true);}}
            style={{
              background: 'rgba(59, 130, 246, 0.25)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 12px rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '2.75rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.35)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 24px rgba(59, 130, 246, 0.3)';
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.25)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 12px rgba(59, 130, 246, 0.2)';
              e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            }}
          >
            <Mail className="w-4 h-4" />
            Send Email
          </button>
          
          <button 
            onClick={() => setShowLogCommModal(true)}
            style={{
              background: 'rgba(147, 51, 234, 0.25)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(147, 51, 234, 0.4)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 12px rgba(147, 51, 234, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '2.75rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(147, 51, 234, 0.35)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 24px rgba(147, 51, 234, 0.3)';
              e.target.style.borderColor = 'rgba(147, 51, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(147, 51, 234, 0.25)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 12px rgba(147, 51, 234, 0.2)';
              e.target.style.borderColor = 'rgba(147, 51, 234, 0.4)';
            }}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Log Communication</span>
          </button>
          
          <button 
            onClick={() => setShowTaskModal(true)}
            style={{
              background: 'rgba(249, 115, 22, 0.25)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(249, 115, 22, 0.4)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 12px rgba(249, 115, 22, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '2.75rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(249, 115, 22, 0.35)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 24px rgba(249, 115, 22, 0.3)';
              e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(249, 115, 22, 0.25)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 12px rgba(249, 115, 22, 0.2)';
              e.target.style.borderColor = 'rgba(249, 115, 22, 0.4)';
            }}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Task</span>
          </button>
          
          <button 
            onClick={() => {setModalType('note'); setShowModal(true);}}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 12px rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '2.75rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 24px rgba(255, 255, 255, 0.2)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 12px rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            <Plus className="w-4 h-4" />
            Add Note
          </button>
          
          <button 
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 12px rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '2.75rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.35)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 24px rgba(239, 68, 68, 0.3)';
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.25)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 12px rgba(239, 68, 68, 0.2)';
              e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info Card */}
            <div className="profile-card">
              <h3>Basic Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedStudent.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedStudent.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedStudent.country}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{selectedStudent.grade}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Dream University: <span className="font-medium">{selectedStudent.dreamUniversity}</span></div>
                    <div>Major: <span className="font-medium">{selectedStudent.major}</span></div>
                    <div>GPA: <span className="font-medium">{selectedStudent.gpa}</span></div>
                    <div>SAT Score: <span className="font-medium">{selectedStudent.satScore}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="profile-card">
              <h3>Engagement Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Engagement Score</span>
                  <div className="flex items-center space-x-2">
                    <div className="engagement-bar">
                      <div 
                        className={`engagement-fill ${selectedStudent.engagementScore >= 70 ? 'engagement-high' : selectedStudent.engagementScore >= 40 ? 'engagement-medium' : 'engagement-low'}`}
                        style={{ width: `${selectedStudent.engagementScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{selectedStudent.engagementScore}%</span>
                  </div>
                </div>
                
                {/* Single line for AI Questions and Documents */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-blue-600">{selectedStudent.aiQuestionsAsked}</div>
                    <div className="text-xs text-gray-600">AI Questions</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-green-600">{selectedStudent.documentsSubmitted}</div>
                    <div className="text-xs text-gray-600">Documents</div>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Intent Level</span>
                    <span className={`font-medium ${getRiskColor(selectedStudent.intent)}`}>
                      {selectedStudent.intent.charAt(0).toUpperCase() + selectedStudent.intent.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Last Active</span>
                    <span className="font-medium">{selectedStudent.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Progress */}
            <div className="profile-card">
              <h3>Application Progress</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Personal Essay</span>
                    <span className={`status-badge ${selectedStudent.essays.personal === 'Completed' ? 'status-submitted' : selectedStudent.essays.personal === 'In Progress' ? 'status-applying' : 'status-exploring'}`}>
                      {selectedStudent.essays.personal}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Supplemental Essays</span>
                    <span className={`status-badge ${selectedStudent.essays.supplemental === 'Completed' ? 'status-submitted' : selectedStudent.essays.supplemental === 'In Progress' ? 'status-applying' : 'status-exploring'}`}>
                      {selectedStudent.essays.supplemental}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="progress-container">
                  <div className="text-sm font-medium mb-2">Overall Progress</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${selectedStudent.applicationStatus === 'Exploring' ? '25%' : selectedStudent.applicationStatus === 'Shortlisting' ? '50%' : selectedStudent.applicationStatus === 'Applying' ? '75%' : '100%'}` }}
                    ></div>
                  </div>
                  <div className="progress-labels">
                    <span>Exploring</span>
                    <span>Shortlisting</span>
                    <span>Applying</span>
                    <span>Submitted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Communication Log */}
            <div className="lg:col-span-2 profile-card">
              <h3>Communication History</h3>
              <div className="space-y-3">
                {selectedStudent.communications.length > 0 ? (
                  selectedStudent.communications.map((comm, idx) => (
                    <div key={idx} className={`communication-item ${comm.type === 'email' ? 'communication-email' : comm.type === 'phone' ? 'communication-phone' : comm.type === 'meeting' ? 'communication-meeting' : 'communication-sms'}`}>
                      <div className={`communication-icon ${comm.type === 'email' ? 'communication-email' : comm.type === 'phone' ? 'communication-phone' : comm.type === 'meeting' ? 'communication-meeting' : 'communication-sms'}`}>
                        {comm.type === 'email' ? <Mail className="w-4 h-4" /> : 
                         comm.type === 'phone' ? <Phone className="w-4 h-4" /> :
                         comm.type === 'meeting' ? <User className="w-4 h-4" /> :
                         <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{comm.content}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {comm.type.toUpperCase()} • {comm.date}
                              {comm.duration && ` • ${comm.duration}`}
                              {comm.loggedBy && ` • Logged by ${comm.loggedBy}`}
                            </div>
                            {comm.outcome && (
                              <div className="text-xs text-gray-600 mt-1 italic">
                                Outcome: {comm.outcome}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            comm.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            comm.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                            comm.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {comm.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <div>No communications yet</div>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="profile-card">
              <h3>Internal Notes</h3>
              <div className="space-y-3">
                {selectedStudent.notes.length > 0 ? (
                  selectedStudent.notes.map((note, idx) => (
                    <div key={idx} className="note-item">
                      <div className="note-content">{note.content}</div>
                      <div className="note-meta">
                        {note.author} • {note.date}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Edit3 className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <div className="text-sm">No notes yet</div>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks & Reminders for this student */}
            <div className="lg:col-span-3 profile-card">
              <div className="flex items-center justify-between mb-4">
                <h3>Tasks & Reminders</h3>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="text-sm bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700"
                >
                  + Add Task
                </button>
              </div>
              <div className="space-y-3">
                {getTasksForStudent(selectedStudent.id).length > 0 ? (
                  getTasksForStudent(selectedStudent.id).map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`text-sm font-medium px-2 py-1 rounded ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {task.type === 'reminder' ? 'Reminder' : 'Task'}
                            </span>
                            <span className="text-sm text-gray-500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Assigned to: {task.assignedTo} • Created by: {task.createdBy}
                          </div>
                        </div>
                        <button
                          onClick={() => markTaskComplete(task.id)}
                          className="ml-4 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Mark Complete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <div>No pending tasks or reminders</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">
                {modalType === 'email' ? 'Send Follow-up Email' : 'Add Internal Note'}
              </h3>
              
              {modalType === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Email Type</label>
                    <select className="form-select">
                      <option>Essay Deadline Reminder</option>
                      <option>Application Check-in</option>
                      <option>University Selection Guidance</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        logCommunication('email', 'Follow-up email sent');
                        setShowModal(false);
                      }}
                      className="btn-primary"
                    >
                      Send Email (Mock)
                    </button>
                    <button 
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add your note here..."
                    className="form-textarea"
                  />
                  <div className="flex space-x-2">
                    <button 
                      onClick={addNote}
                      className="btn-primary"
                    >
                      Add Note
                    </button>
                    <button 
                      onClick={() => {setShowModal(false); setNewNote('');}}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Log Communication Modal */}
        {showLogCommModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <h3 className="modal-title">Log Communication</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Communication Type</label>
                    <select 
                      value={commData.type} 
                      onChange={(e) => setCommData({...commData, type: e.target.value})}
                      className="form-select"
                    >
                      <option value="phone">Phone Call</option>
                      <option value="meeting">In-Person Meeting</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS/Text</option>
                      <option value="video">Video Call</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Date</label>
                    <input 
                      type="date" 
                      value={commData.date}
                      onChange={(e) => setCommData({...commData, date: e.target.value})}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Communication Summary *</label>
                  <textarea
                    value={commData.content}
                    onChange={(e) => setCommData({...commData, content: e.target.value})}
                    placeholder="Describe what was discussed..."
                    className="form-textarea"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Duration (optional)</label>
                    <input 
                      type="text" 
                      value={commData.duration}
                      onChange={(e) => setCommData({...commData, duration: e.target.value})}
                      placeholder="e.g., 30 minutes"
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Status</label>
                    <select 
                      value={commData.status} 
                      onChange={(e) => setCommData({...commData, status: e.target.value})}
                      className="form-select"
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending Follow-up</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Outcome/Next Steps (optional)</label>
                  <textarea
                    value={commData.outcome}
                    onChange={(e) => setCommData({...commData, outcome: e.target.value})}
                    placeholder="What was decided or what needs to happen next..."
                    className="form-textarea"
                    rows="2"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={handleLogCommunication}
                    className="btn-primary flex-1"
                    disabled={!commData.content.trim()}
                  >
                    Log Communication
                  </button>
                  <button 
                    onClick={() => {
                      setShowLogCommModal(false);
                      setCommData({
                        type: 'phone',
                        content: '',
                        date: new Date().toISOString().split('T')[0],
                        status: 'completed',
                        duration: '',
                        outcome: ''
                      });
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Scheduling Modal */}
        {showTaskModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
              <h3 className="modal-title">Schedule Task/Reminder</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Type</label>
                    <select 
                      value={taskData.type} 
                      onChange={(e) => setTaskData({...taskData, type: e.target.value})}
                      className="form-select"
                    >
                      <option value="reminder">Reminder</option>
                      <option value="task">Task</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="form-label">Priority</label>
                    <select 
                      value={taskData.priority} 
                      onChange={(e) => setTaskData({...taskData, priority: e.target.value})}
                      className="form-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    value={taskData.title}
                    onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                    placeholder="e.g., Follow up on essay progress"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={taskData.description}
                    onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                    placeholder="Additional details about this task..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Due Date *</label>
                    <input 
                      type="date" 
                      value={taskData.dueDate}
                      onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})}
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Assigned To</label>
                    <select 
                      value={taskData.assignedTo} 
                      onChange={(e) => setTaskData({...taskData, assignedTo: e.target.value})}
                      className="form-select"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Counselor">Counselor</option>
                      <option value="Manager">Manager</option>
                      <option value="Team">Entire Team</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={handleCreateTask}
                    className="btn-primary flex-1"
                    disabled={!taskData.title.trim() || !taskData.dueDate}
                  >
                    Create Task
                  </button>
                  <button 
                    onClick={() => {
                      setShowTaskModal(false);
                      setTaskData({
                        title: '',
                        description: '',
                        dueDate: '',
                        priority: 'medium',
                        assignedTo: 'Admin',
                        type: 'reminder',
                        status: 'pending'
                      });
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main dashboard view
return (
  <div className="dashboard-container">
    {/* Header */}
    <div className="dashboard-header">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Title and Buttons */}
          <div className="flex items-center space-x-6">
            <div>
              <h1 className="dashboard-title">Admin Dashboard</h1>
              <p className="dashboard-subtitle">Undergraduation.com CRM System</p>
            </div>
            <div className="flex items-right space-x-5">
              
              
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-500 hover:text-gray-700 cursor-pointer" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full pulse"></span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Admin User</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-soft">
                <span className="text-white text-sm font-medium">AU</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats-card fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="stats-number">{stats.applying}</div>
                <div className="stats-label">Currently Applying</div>
              </div>
              <div className="stats-icon bg-orange-100">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            
          </div>

          <div className="stats-card fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="stats-number">{stats.highIntent}</div>
                <div className="stats-label">High Intent</div>
              </div>
              <div className="stats-icon bg-green-100">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
            </div>
            
          </div>

          <div className="stats-card fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="stats-number">{stats.needsContact}</div>
                <div className="stats-label">Need Contact</div>
              </div>
              <div className="stats-icon bg-yellow-100">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            
          </div>

          <div className="stats-card fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="stats-number">{getUpcomingTasks().length}</div>
                <div className="stats-label">Upcoming Tasks</div>
              </div>
              <div className="stats-icon bg-blue-100">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6">
        <div className="search-section">
          <div className="search-header">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Status</option>
                  <option value="Exploring">Exploring</option>
                  <option value="Shortlisting">Shortlisting</option>
                  <option value="Applying">Applying</option>
                  <option value="Submitted">Submitted</option>
                </select>
                
                <button 
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                  className="flex items-center space-x-2 px-4 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                  <span className={`transform transition-transform ${showMoreFilters ? 'rotate-180' : ''}`}>▼</span>
                </button>
              </div>
            </div>

            {/* More Filters Section */}
            {showMoreFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intent Level</label>
                    <select
                      value={intentFilter}
                      onChange={(e) => setIntentFilter(e.target.value)}
                      className="filter-select w-full"
                    >
                      <option value="All">All Intent Levels</option>
                      <option value="exploring">Exploring</option>
                      <option value="interested">Interested</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Active</label>
                    <select
                      value={lastActiveFilter}
                      onChange={(e) => setLastActiveFilter(e.target.value)}
                      className="filter-select w-full"
                    >
                      <option value="All">All Students</option>
                      <option value="Before7Days">Inactive 7+ days</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStatusFilter('All');
                        setIntentFilter('All');
                        setLastActiveFilter('All');
                        setSearchTerm('');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Student Table */}
          <div className="student-table">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Student</th>
                  <th className="table-cell">Country</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell">Engagement</th>
                  <th className="table-cell">Last Active</th>
                  <th className="table-cell">Intent</th>
                  <th className="table-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="student-avatar">
                          {student.name.charAt(0)}
                        </div>
                        <div className="ml-4 student-info">
                          <h4>{student.name}</h4>
                          <p>{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm font-medium text-gray-900">{student.country}</div>
                    </td>
                    <td className="table-cell">
                      <span className={`status-badge ${getStatusColor(student.applicationStatus)}`}>
                        {student.applicationStatus}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="engagement-bar">
                          <div 
                            className={`engagement-fill ${student.engagementScore >= 70 ? 'engagement-high' : student.engagementScore >= 40 ? 'engagement-medium' : 'engagement-low'}`}
                            style={{ width: `${student.engagementScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{student.engagementScore}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{student.lastActive}</div>
                    </td>
                    <td className="table-cell">
                      <span className={`text-sm font-medium ${getRiskColor(student.intent)}`}>
                        {student.intent.charAt(0).toUpperCase() + student.intent.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="action-buttons">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="action-btn action-view"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(student);
                            setModalType('email');
                            setShowModal(true);
                          }}
                          className="action-btn action-email"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(student);
                            setModalType('note');
                            setShowModal(true);
                          }}
                          className="action-btn action-edit"
                          title="Add Note"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">Add New Student</h3>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={newStudentData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="form-input"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={newStudentData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="form-input"
                    placeholder="student@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    value={newStudentData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="form-input"
                    placeholder="+1-555-0123"
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Country *</label>
                  <input
                    type="text"
                    value={newStudentData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="form-input"
                    placeholder="Enter country"
                    required
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Grade</label>
                  <select
                    value={newStudentData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    className="form-select"
                  >
                    <option value="11th Grade">11th Grade</option>
                    <option value="12th Grade">12th Grade</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Application Status</label>
                  <select
                    value={newStudentData.applicationStatus}
                    onChange={(e) => handleInputChange('applicationStatus', e.target.value)}
                    className="form-select"
                  >
                    <option value="Exploring">Exploring</option>
                    <option value="Shortlisting">Shortlisting</option>
                    <option value="Applying">Applying</option>
                    <option value="Submitted">Submitted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Dream University</label>
                  <input
                    type="text"
                    value={newStudentData.dreamUniversity}
                    onChange={(e) => handleInputChange('dreamUniversity', e.target.value)}
                    className="form-input"
                    placeholder="e.g., Harvard University"
                  />
                </div>
                
                <div>
                  <label className="form-label">Intended Major</label>
                  <input
                    type="text"
                    value={newStudentData.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    className="form-input"
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </div>

              {/* Academic Scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">GPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="4.0"
                    value={newStudentData.gpa}
                    onChange={(e) => handleInputChange('gpa', e.target.value)}
                    className="form-input"
                    placeholder="3.8"
                  />
                </div>
                
                <div>
                  <label className="form-label">SAT Score</label>
                  <input
                    type="number"
                    min="400"
                    max="1600"
                    value={newStudentData.satScore}
                    onChange={(e) => handleInputChange('satScore', e.target.value)}
                    className="form-input"
                    placeholder="1520"
                  />
                </div>
                
                <div>
                  <label className="form-label">Intent Level</label>
                  <select
                    value={newStudentData.intent}
                    onChange={(e) => handleInputChange('intent', e.target.value)}
                    className="form-select"
                  >
                    <option value="exploring">Exploring</option>
                    <option value="interested">Interested</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Engagement Score */}
              <div>
                <label className="form-label">Initial Engagement Score: {newStudentData.engagementScore}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newStudentData.engagementScore}
                  onChange={(e) => handleInputChange('engagementScore', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={handleAddStudent}
                  className="btn-primary flex-1"
                >
                  Add Student
                </button>
                <button 
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setNewStudentData({
                      name: '',
                      email: '',
                      phone: '',
                      country: '',
                      grade: '11th Grade',
                      applicationStatus: 'Exploring',
                      dreamUniversity: '',
                      major: '',
                      gpa: '',
                      satScore: '',
                      engagementScore: 50,
                      intent: 'interested'
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;