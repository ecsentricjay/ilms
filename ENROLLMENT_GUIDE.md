# Quick Reference: Enrolling Students in Multiple Courses

## How the System Works

### Database Design
```
Enrolments Table (has unique constraint):
┌─────────────────────────────────────────────────┐
│ student_id (UUID)  │ course_id (UUID)          │
├─────────────────────────────────────────────────┤
│ Chidi-UUID         │ CS-101-UUID    ✅ Allowed │
│ Chidi-UUID         │ CS-301-UUID    ✅ Allowed │
│ Chidi-UUID         │ CS-201-UUID    ✅ Allowed │
│ Chidi-UUID         │ CS-101-UUID    ❌ NOT allowed (duplicate)
└─────────────────────────────────────────────────┘
```

**Key Point:** A student can be in ANY course, but can't be in the SAME course twice.

---

## How to Enrol a Student in Multiple Courses

### Method 1: Using Admin Dashboard (Recommended)

**Step 1: Open Enrol Form**
```
Admin Dashboard
→ Click "Enrol Student" button (on Overview or Enrolments tab)
→ Modal opens: "Enrol Student into Course"
```

**Step 2: First Enrollment**
```
Select Student: Chidi Nwosu
Select Course: CS 101
Click: "Enrol"
✅ Success! Student enrolled in CS 101
```

**Step 3: Second Enrollment (Same Student)**
```
Click "Enrol Student" button again
Select Student: Chidi Nwosu (SAME student)
Select Course: CS 301 (DIFFERENT course)
Click: "Enrol"
✅ Success! Student now enrolled in CS 101 AND CS 301
```

**Step 4: Third Enrollment (Repeat)**
```
Click "Enrol Student" button again
Select Student: Chidi Nwosu (SAME student)
Select Course: CS 201 (DIFFERENT course)
Click: "Enrol"
✅ Success! Student now enrolled in 3 courses
```

**Result:**
```
Chidi Nwosu is now enrolled in:
- CS 101 ✅
- CS 301 ✅
- CS 201 ✅
```

---

### Method 2: Using API (For Integration)

**Enroll Student in First Course:**
```bash
curl -X POST http://localhost:5000/api/admin/enrol \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "chidi-uuid",
    "course_id": "cs101-uuid"
  }'

Response: 201 Created
{
  "id": "enrollment-uuid-1",
  "student_id": "chidi-uuid",
  "course_id": "cs101-uuid",
  "enrolled_at": "2024-08-27T10:30:00Z"
}
```

**Enroll SAME Student in Second Course:**
```bash
curl -X POST http://localhost:5000/api/admin/enrol \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "chidi-uuid",
    "course_id": "cs301-uuid"  ← Different course!
  }'

Response: 201 Created
{
  "id": "enrollment-uuid-2",
  "student_id": "chidi-uuid",
  "course_id": "cs301-uuid",
  "enrolled_at": "2024-08-27T10:45:00Z"
}
```

**Enroll in Third Course:**
```bash
curl -X POST http://localhost:5000/api/admin/enrol \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "chidi-uuid",
    "course_id": "cs201-uuid"  ← Another different course!
  }'
```

**Result:** Student is enrolled in 3 courses ✅

---

## Verify Multiple Enrollments

### In Admin Dashboard:
1. Go to **Users** tab
2. Search for "Chidi Nwosu"
3. Click **"View Data"** button
4. Scroll to "Course Performance"
5. See list showing all 3 courses with performance data

### In Enrolments Tab:
1. Go to **Enrolments** tab
2. Look for all rows with "Chidi Nwosu"
3. Should see 3 rows (one for each course)

### In Database:
```sql
SELECT student_id, course_id, enrolled_at 
FROM public.enrolments 
WHERE student_id = 'chidi-uuid'
ORDER BY enrolled_at;

Result:
┌──────────────┬──────────────┬─────────────────────┐
│ student_id   │ course_id    │ enrolled_at         │
├──────────────┼──────────────┼─────────────────────┤
│ chidi-uuid   │ cs101-uuid   │ 2024-08-27 10:30:00 │
│ chidi-uuid   │ cs301-uuid   │ 2024-08-27 10:45:00 │
│ chidi-uuid   │ cs201-uuid   │ 2024-08-27 11:00:00 │
└──────────────┴──────────────┴─────────────────────┘
```

---

## What Happens to Each Enrollment

### Data Tracked Per Enrollment:
Each enrollment creates separate records for:
- **Submissions** - Track assignments per course
- **Grades** - Store final score/grade per course
- **Attendance** - Track presence per course, per session
- **Results** - Final grade published per course

### Example for Chidi in CS 101 vs CS 301:
```
CS 101 Performance:
- Submissions: 2 (both graded)
- Average: 18.5/20
- Attendance: 5 sessions (4 present, 1 late)
- Final Grade: A (92.5)

CS 301 Performance:
- Submissions: 2 (both graded)
- Average: 22.5/25
- Attendance: 3 sessions (3 present)
- Final Grade: A (87.0)
```

Each course is tracked independently!

---

## Error Handling

### ❌ Error: "Duplicate enrollment"
**Cause:** Trying to enroll student in same course twice
```
Enrol Chidi in CS 101
Then:
Enrol Chidi in CS 101 again ← ERROR!
```
**Solution:** Select a DIFFERENT course

### ❌ Error: "Student not found"
**Cause:** Student doesn't exist or is inactive
```
Students list is empty OR
Student has is_active = false
```
**Solution:** 
- Create student first via registration
- Activate inactive student

### ❌ Error: "Course not found"
**Cause:** Course doesn't exist or lecturer is inactive
```
Courses list is empty OR
No courses available
```
**Solution:** Create course first and assign to active lecturer

### ✅ Success: "Enrollment created"
```
Student successfully enrolled in course
Ready to track attendance, grades, submissions for this course
```

---

## Real World Scenario

### Semester Setup Process:

**Step 1: Admin enrolls students**
```
Start of semester:
Admin enrolls Chidi in: CS 101, CS 301, CS 201, CS 102
Admin enrolls Amaka in: CS 101, CS 301, MATH 201
Admin enrolls Ikechukwu in: CS 101, CS 201, CS 102
... etc for all students
```

**Step 2: Lecturers mark attendance**
```
Each lecturer marks attendance per course per session
- John Okafor marks attendance in CS 101, CS 201
- Ada Eze marks attendance in CS 301
- Emeka Nnamdi marks attendance in CS 102, MATH 201
```

**Step 3: Lecturers grade assignments**
```
For each course they teach:
- Create assignments
- Students submit work
- Lecturers grade each submission
All tracked separately per course
```

**Step 4: Lecturers publish results**
```
For each course:
- Calculate final grade
- Publish result per course
Chidi might get: A in CS 101, A in CS 301, A in CS 201, A in CS 102
```

**Step 5: Admin reviews performance**
```
Admin can view:
- Chidi's performance in each course separately
- Overall performance across all courses
- Edit any grade if error found
- Update attendance if needed
```

---

## Key Differences: One Student, Multiple Courses

### ✅ What's the SAME:
- Same student account
- Same authentication
- Same profile information

### ❌ What's DIFFERENT:
| Aspect | CS 101 | CS 301 | CS 201 |
|--------|--------|--------|---------|
| Lecturer | Dr. Okafor | Prof. Eze | Dr. Okafor |
| Submissions | Track CS 101 assignments | Track CS 301 assignments | Track CS 201 assignments |
| Attendance | Track CS 101 sessions | Track CS 301 sessions | Track CS 201 sessions |
| Grades | Grade for CS 101 | Grade for CS 301 | Grade for CS 201 |
| Performance | Individual score | Individual score | Individual score |

Each course is completely independent!

---

## Quick Commands

### Enroll via Dashboard
```
1. Click "+ Enrol Student"
2. Select Student
3. Select Course
4. Click Enrol
5. Repeat steps 1-4 for same student, different courses
```

### Check Enrollments
```
Admin Dashboard → Enrolments tab
See all student-course pairs with enrollment dates
```

### View Student's All Courses
```
Admin Dashboard → Users tab
→ Find Student
→ Click "View Data"
→ See all enrolled courses with performance
```

### View Course's All Students
```
Admin Dashboard → Courses tab
→ Click "View Students"
→ See all students in course with performance
```

---

## Troubleshooting Enrollments

| Problem | Cause | Solution |
|---------|-------|----------|
| Can't see students in dropdown | No students created | Create students first via registration |
| Can't see courses in dropdown | No courses created | Create courses first with assigned lecturer |
| "Duplicate error" when enrolling | Student already in this course | Choose different course |
| Enrollment succeeds but doesn't show | Page not refreshed | Refresh browser or re-login |
| Can't enroll inactive student | Student is_active = false | Deactivate/reactivate them first |

---

## Best Practices

✅ **DO:**
- Enroll students at semester start in all their courses
- Check student course load (typically 3-5 courses)
- Verify enrollments before posting semester schedule
- Update enrollment if student changes course
- Use multi-course enrollment to organize student schedules

❌ **DON'T:**
- Try to enroll same student in same course twice
- Enroll student after semester has started (without reason)
- Enroll in too many courses without admin review
- Delete enrollments carelessly (affects all course data)
- Forget to enroll students (they won't see course content)

---

## Enrollment Scenarios from Seed Data

### Scenario 1: Chidi (4 Courses)
```
Enrol in: CS 101, CS 301, CS 201, CS 102
Result:
✅ 4 enrollment records created
✅ 4 separate performance tracks
✅ Attendance marked per course
✅ Grades assigned per course
✅ View all 4 courses when viewing student data
```

### Scenario 2: Amaka (3 Courses)
```
Enrol in: CS 101, CS 301, MATH 201
Result:
✅ 3 enrollment records created
✅ Different lecturers per course
✅ Independent performance tracking
✅ Cross-department courses supported
```

### Scenario 3: Blessing (2 Courses)
```
Enrol in: CS 301, CS 201
Result:
✅ 2 enrollment records
✅ Same lecturer (Dr. Okafor) in CS 201
✅ Different lecturer (Prof. Eze) in CS 301
✅ Independent attendance and grades
```

---

## Summary

**How to enroll students in multiple courses:**
1. Click "+ Enrol Student"
2. Select student + course
3. Click Enrol
4. **Repeat for same student, different courses** ← Key point!
5. Each enrollment is independent

**Result:**
- Student sees all courses
- Each course has separate data (submissions, grades, attendance)
- Admin can view and edit per-course data
- System tracks everything independently

**Key Concept:**
```
Multiple enrollments = One student in Many courses
Not = One course with many entries
```

---

**Ready to enroll? Start in Admin Dashboard → Click "+ Enrol Student"! 🎓**
