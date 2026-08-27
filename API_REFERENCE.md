# Admin API Quick Reference

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
```
Header: Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

## Endpoints Summary

### 👨‍🏫 Lecturer Management

#### Create Lecturer Account
```
POST /create-lecturer
```
**Body:**
```json
{
  "full_name": "Dr. Jane Doe",
  "email": "jane@university.edu",
  "password": "SecurePass123"
}
```
**Response:** `201 Created`
```json
{
  "message": "Lecturer account created successfully",
  "user": {
    "id": "uuid",
    "full_name": "Dr. Jane Doe",
    "email": "jane@university.edu",
    "role": "lecturer"
  }
}
```

---

### 👥 User Management

#### Get All Users
```
GET /users
```
**Response:** Array of user objects with all fields

---

#### Get All Lecturers (Active)
```
GET /lecturers
```
**Response:**
```json
[
  {
    "id": "uuid",
    "full_name": "Dr. John Okafor",
    "email": "john@university.edu"
  }
]
```

---

#### Get All Students (Active)
```
GET /students
```
**Response:**
```json
[
  {
    "id": "uuid",
    "full_name": "Chidi Nwosu",
    "email": "chidi@university.edu"
  }
]
```

---

#### Update User Profile
```
PATCH /users/:id/profile
```
**Body:**
```json
{
  "full_name": "New Name",
  "email": "newemail@university.edu"
}
```
**Note:** At least one field required
**Response:** `200 OK` with updated user

---

#### Toggle User Status
```
PATCH /users/:id/status
```
**Body:**
```json
{
  "is_active": false
}
```
**Response:** `200 OK` with updated user

---

### 📚 Course Management

#### Get All Courses
```
GET /courses
```
**Response:** Array of courses with student/material/assignment counts

---

#### Create Course
```
POST /courses
```
**Body:**
```json
{
  "course_title": "Database Systems",
  "course_code": "CS 301",
  "description": "Introduction to relational databases",
  "semester": "2024/2025 Second Semester",
  "lecturer_id": "uuid"
}
```
**Response:** `201 Created`

---

#### Reassign Course to Different Lecturer
```
PATCH /courses/:id/reassign
```
**Body:**
```json
{
  "lecturer_id": "new-lecturer-uuid"
}
```
**Response:** `200 OK` with updated course

---

### 📊 Grades & Results

#### Create or Update Student Result
```
POST /results
```
**Body:**
```json
{
  "student_id": "student-uuid",
  "course_id": "course-uuid",
  "total_score": 87.5,
  "grade": "A"
}
```
**Response:** `201 Created` or updated result

---

#### Update Existing Result
```
PATCH /results/:id
```
**Body:**
```json
{
  "total_score": 92,
  "grade": "A"
}
```
**Response:** `200 OK` with updated result

---

### ✅ Attendance

#### Create or Update Attendance
```
POST /attendance
```
**Body:**
```json
{
  "student_id": "student-uuid",
  "course_id": "course-uuid",
  "session_date": "2024-08-27",
  "status": "present"
}
```
**Status values:** `"present"`, `"absent"`, `"late"`

**Response:** `201 Created` or updated record

---

#### Update Attendance Record
```
PATCH /attendance/:id
```
**Body:**
```json
{
  "status": "late"
}
```
**Response:** `200 OK` with updated record

---

### 📝 Submissions & Grading

#### Grade a Submission
```
PATCH /submissions/:id
```
**Body:**
```json
{
  "grade": 88,
  "feedback": "Excellent work! Clear logic and good structure."
}
```
**Response:** `200 OK` with updated submission

---

### 📊 View Data & Analytics

#### Get All Enrollments
```
GET /enrolments
```
**Response:** Array with student, course, and enrollment date

---

#### Get Dashboard Statistics
```
GET /stats
```
**Response:**
```json
{
  "totalUsers": 150,
  "totalStudents": 120,
  "totalLecturers": 25,
  "totalCourses": 18,
  "totalEnrolments": 420,
  "totalSubmissions": 1250
}
```

---

#### View All Students in a Course
```
GET /course/:id/students
```
**Response:**
```json
{
  "course": { /* course details */ },
  "students": [
    {
      "studentId": "uuid",
      "studentName": "Chidi Nwosu",
      "studentEmail": "chidi@university.edu",
      "submissionCount": 5,
      "gradedSubmissions": 4,
      "averageSubmissionGrade": 82.5,
      "attendance": {
        "present": 12,
        "absent": 2,
        "late": 1
      },
      "result": {
        "id": "uuid",
        "total_score": 85,
        "grade": "A"
      }
    }
  ]
}
```

---

#### View Detailed Lecturer Information
```
GET /lecturer/:id/detailed
```
**Response:**
```json
{
  "lecturer": { /* full profile */ },
  "courses": [
    {
      "id": "uuid",
      "course_title": "Advanced Java",
      "course_code": "CS 401",
      "studentCount": 45,
      "materialCount": 12,
      "assignmentCount": 8,
      "totalSubmissions": 340,
      "gradedSubmissions": 335,
      "averageSubmissionGrade": 78.5,
      "attendanceRecorded": 450
    }
  ],
  "summary": {
    "totalCourses": 3,
    "totalStudents": 120,
    "totalAssignments": 24,
    "totalSubmissions": 850
  }
}
```

---

#### View Detailed Student Information
```
GET /student/:id/detailed
```
**Response:**
```json
{
  "student": { /* full profile */ },
  "coursePerformance": [
    {
      "courseId": "uuid",
      "courseTitle": "Database Systems",
      "courseCode": "CS 301",
      "semester": "2024/2025 First Semester",
      "lecturer": { /* lecturer info */ },
      "submissions": [ /* array of submissions */ ],
      "submissionSummary": {
        "total": 5,
        "graded": 5,
        "pending": 0,
        "averageGrade": 84.2
      },
      "attendance": {
        "total": 15,
        "present": 14,
        "absent": 1,
        "late": 0,
        "attendanceRate": "93.33"
      },
      "result": {
        "id": "uuid",
        "total_score": 88,
        "grade": "A",
        "published_at": "2024-08-27T10:30:00Z"
      }
    }
  ],
  "summary": {
    "enrolledCourses": 4,
    "totalSubmissions": 18,
    "overallAverageGrade": 85.3,
    "coursesWithResults": 3
  }
}
```

---

### 📋 Enrollment

#### Get All Enrollments
```
GET /enrolments
```
**Response:** Array with student, course, enrollment date

---

#### Enrol Student in Course
```
POST /enrol
```
**Body:**
```json
{
  "student_id": "student-uuid",
  "course_id": "course-uuid"
}
```
**Response:** `201 Created`

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "student_id and course_id are required"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Admin role required"
}
```

### 500 Server Error
```json
{
  "error": "Server error"
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK (GET, PATCH successful) |
| 201 | Created (POST successful) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (not admin role) |
| 500 | Server Error |

---

## Example cURL Requests

### Create Lecturer
```bash
curl -X POST http://localhost:5000/api/admin/create-lecturer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Dr. Jane Doe",
    "email": "jane@university.edu",
    "password": "SecurePass123"
  }'
```

### View Student Details
```bash
curl -X GET http://localhost:5000/api/admin/student/STUDENT_UUID/detailed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Grade
```bash
curl -X PATCH http://localhost:5000/api/admin/results/RESULT_UUID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "total_score": 90,
    "grade": "A"
  }'
```

### Mark Attendance
```bash
curl -X POST http://localhost:5000/api/admin/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STUDENT_UUID",
    "course_id": "COURSE_UUID",
    "session_date": "2024-08-27",
    "status": "present"
  }'
```

---

## Data Types

| Type | Format | Example |
|------|--------|---------|
| UUID | string | `"550e8400-e29b-41d4-a716-446655440000"` |
| Email | string | `"user@university.edu"` |
| Score | number | `85.5` |
| Grade | string | `"A"`, `"B"`, `"C"`, `"D"`, `"F"` |
| Status | string | `"present"`, `"absent"`, `"late"` |
| Date | string (ISO) | `"2024-08-27"` |
| DateTime | string (ISO) | `"2024-08-27T10:30:00Z"` |

---

## Audit Trail Fields

All data modifications include:
- `modified_by`: UUID of admin who made change
- `modified_at`: Timestamp of change

Example:
```json
{
  "id": "uuid",
  "total_score": 90,
  "grade": "A",
  "modified_by": "admin-uuid-here",
  "modified_at": "2024-08-27T14:30:00Z"
}
```

---

## Rate Limiting

Currently no rate limiting. For production, consider:
- Implement request rate limiting
- Add API key authentication
- Monitor for abuse

---

## Performance Tips

1. **Use filtering** when possible (GET /lecturers vs GET /users)
2. **Batch related requests** (get course then students)
3. **Cache static data** (lecturers list rarely changes)
4. **Paginate large results** (for future enhancement)

---

## Pagination (Future)

Currently not implemented. Consider adding:
```
GET /students?page=1&limit=20
```

---

## Questions?

Refer to:
- `ADMIN_FEATURES_GUIDE.md` - Full documentation
- `server/routes/admin.js` - Source code comments
- `client/src/pages/admin/AdminDashboard.jsx` - Frontend implementation
