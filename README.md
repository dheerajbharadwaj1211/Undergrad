

# CRM Dashboard

A lightweight internal CRM dashboard for managing student interactions and tracking college application progress on the Undergraduation.com platform.

## 🎯 Overview

This admin dashboard provides the internal team with a centralized view of each student's journey, showing engagement levels, application progress, and communication history.

## ✨ Features

### 📊 Student Directory View
- **Comprehensive Table View**: Display all students with key information at a glance
- **Advanced Filtering**: Filter by application status, intent level, last activity
- **Search Functionality**: Search students by name or email
- **Status Tracking**: Visual status badges for application stages
- **Engagement Metrics**: Visual engagement score bars and progress indicators

### 👤 Individual Student Profiles
- **Basic Information**: Name, email, phone, grade, country, academic details
- **Engagement Analytics**: 
  - AI questions asked
  - Documents submitted
  - Last active date
  - Engagement score with visual progress bar
- **Application Progress**: 
  - Current application status
  - Essay completion tracking
  - Progress visualization
- **Communication History**: Complete log of all interactions
- **Internal Notes**: Add, view, and manage team notes

### 📞 Communication Tools
- **Manual Communication Logging**: Log phone calls, meetings, emails
- **Follow-up Email Triggers**: Mock email sending functionality
- **Task & Reminder Scheduling**: Create and manage team tasks
- **Communication Timeline**: Chronological view of all interactions

### 📈 Analytics & Insights
- **Dashboard Statistics**: 
  - Students currently applying
  - High intent students
  - Students needing contact
  - Upcoming tasks
- **Quick Filters**:
  - Students not contacted in 7+ days
  - High intent students
  - By application status
- **Engagement Tracking**: Visual representation of student engagement levels

## 🛠 Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: CSS3 with custom dashboard styling
- **Icons**: Lucide React
- **Database**: Firebase Firestore
- **Authentication**: Custom Firebase Auth integration
- **State Management**: React useState and useEffect

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account and project

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/newfolder.git
cd newfolder
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Create a `firebase.js` file in the `src` directory:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 4. Environment Setup
Create a `.env` file in the root directory:
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 5. Start the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🔐 Authentication

### Default Login Credentials
For development/demo purposes, use:
- **Email**: admin@undergraduation.com
- **Password**: admin123

### Setting Up Authentication
1. In Firebase Console, go to Authentication > Users
2. Add a user with the above credentials
3. Or modify the Login component to use your preferred credentials

## 📁 Project Structure

```
src/
├── components/
│   └── Login.js              # Authentication component
├── App.js                    # Main application component
├── dashboard.css             # Dashboard styling
├── firebase.js               # Firebase configuration
├── studentData.js            # Sample student data
└── index.js                  # Application entry point
```

## 🎨 Key Components

### Dashboard Features
- **Student Directory**: Filterable table with search functionality
- **Student Profiles**: Detailed individual student views
- **Communication Logging**: Track all student interactions
- **Task Management**: Schedule and manage follow-ups
- **Analytics**: Summary statistics and insights

### Data Management
- **Local Data**: Sample student data in `studentData.js`
- **Firebase Integration**: Add students directly to Firestore
- **State Management**: React hooks for local state
- **Data Persistence**: Communications and notes stored locally during session

## 🚀 Usage

### Adding Students
1. Use the sample data provided in `studentData.js`
2. Add new students through the "Add Student" modal
3. Students are automatically saved to Firebase Firestore

### Managing Communications
1. Click on any student to view their profile
2. Use "Log Communication" to record interactions
3. Schedule tasks and reminders for follow-ups
4. Add internal notes for team collaboration

### Filtering & Search
1. Use the search bar to find students by name/email
2. Apply status filters for application stages
3. Use advanced filters for intent level and activity
4. Quick access to students needing attention

## 📊 Sample Data

The application includes sample student data representing various:
- Application statuses (Exploring, Shortlisting, Applying, Submitted)
- Geographic diversity (US, Canada, UK, India, etc.)
- Engagement levels and academic profiles
- Intent levels (exploring, interested, high)

## 🔧 Development Notes

### Mock Functionality
- Email sending is mocked (no actual emails sent)
- Communication logging is stored in component state
- Task management is local to the session

### Future Enhancements
- Real email integration with Customer.io
- Advanced analytics and reporting
- Mobile-responsive design improvements
- Real-time notifications
- Bulk operations for student management


