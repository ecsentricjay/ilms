# Using Seed Data & Testing Admin Features

## Overview
This guide walks you through populating your database with realistic test data and verifying all admin features work correctly.

---

## Part 1: Prepare for Seed Data

### Step 1: Create Auth Users First

You MUST create auth users first. You have two options:

**Option A: Via Application UI**
1. Go to your app's register page
2. Create users with these details:

**Lecturers:**
- Name: `Dr. John Okafor` | Email: `john.okafor@ilms.edu` | Password: `Test123!`
- Name: `Prof. Ada Eze` | Email: `ada.eze@ilms.edu` | Password: `Test123!`
- Name: `Dr. Emeka Nnamdi` | Email: `emeka.nnamdi@ilms.edu` | Password: `Test123!`

**Students:**
- Name: `Chidi Nwosu` | Email: `chidi.nwosu@student.edu` | Password: `Test123!`
- Name: `Amaka Obiora` | Email: `amaka.obiora@student.edu` | Password: `Test123!`
- Name: `Ikechukwu Obi` | Email: `ikechukwu.obi@student.edu` | Password: `Test123!`
- Name: `Blessing Okoro` | Email: `blessing.okoro@student.edu` | Password: `Test123!`
- Name: `Zainab Ibrahim` | Email: `zainab.ibrahim@student.edu` | Password: `Test123!`

**Option B: Use Admin Endpoint**
```bash
POST /api/admin/create-lecturer
Body:
{
  "full_name": "Dr. John Okafor",
  "email": "john.okafor@ilms.edu",
  "password": "Test123!"
}
```

### Step 2: Get the UUIDs

After creating auth users:
1. Go to Supabase Dashboard
2. Navigate to **Auth → Users**
3. For each user, copy their UUID
4. Create a mapping:

```
Dr. John Okafor        → [UUID-1]
Prof. Ada Eze          → [UUID-2]
Dr. Emeka Nnamdi       → [UUID-3]
Chidi Nwosu            → [UUID-4]
Amaka Obiora           → [UUID-5]
Ikechukwu Obi          → [UUID-6]
Blessing Okoro         → [UUID-7]
Zainab Ibrahim         → [UUID-8]
Admin User             → [UUID-9]
```

---

## Part 2: Modify Seed Data with Real UUIDs

Open `SEED_DATA.sql` and replace all placeholder UUIDs:

**Find and Replace:**

```sql
-- BEFORE (placeholder UUIDs)
863e3a48-4e95-4fcd-8d90-b7297a85d9ea = Admin User
fccbbbc5-a125-45c9-934e-fcddd4186f9d = Dr. John Okafor
059f42de-9666-4df2-971c-789f2133da36 = Prof. Ada Eze
75381bc2-4451-48c5-b221-caea47a47d78 = Dr. Emeka Nnamdi
19466a5c-80fa-4225-8536-28b2623f5b1b = Chidi Nwosu
855ed085-8117-477c-8591-7eac60094918 = Amaka Obiora
a290b900-e259-4e6d-802b-ab000ebd8b6b = Ikechukwu Obi
8391a5ff-4dba-42db-8a19-a861e50cf49a = Blessing Okoro
a9c28497-7b1f-45f5-b7f2-49e96ffbe075 = Zainab Ibrahim

-- AFTER (your actual UUIDs)
YOUR-UUID-9 = Admin User
YOUR-UUID-1 = Dr. John Okafor
YOUR-UUID-2 = Prof. Ada Eze
YOUR-UUID-3 = Dr. Emeka Nnamdi
YOUR-UUID-4 = Chidi Nwosu
YOUR-UUID-5 = Amaka Obiora
YOUR-UUID-6 = Ikechukwu Obi
YOUR-UUID-7 = Blessing Okoro
YOUR-UUID-8 = Zainab Ibrahim
```

**Using VS Code Find & Replace:**
1. Open `SEED_DATA.sql`
2. Press `Ctrl+H` (Find & Replace)
3. Replace each UUID one by one:
   - Find: `863e3a48-4e95-4fcd-8d90-b7297a85d9ea`
   - Replace: Your Admin UUID
   - Click "Replace All"

---

## Part 3: Run Seed Data

### Step 1: Execute SQL
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire content of `SEED_DATA.sql`
4. Paste into SQL Editor
5. Click **"Run"**

### Step 2: Verify Success
Run the verification queries at the bottom of `SEED_DATA.sql`:

You should see:
```
Users: 9 records
Courses: 5 records
Enrolments: 16 records
Attendance: 15 records
Assignments: 8 records
Submissions: 8 records
Results: 9 records
Course Content: 10 records
```

---

## Part 4: Test Admin Features

### Test 1: Enrol Students in Multiple Courses

The admin dashboard already supports this! ✅

**How it works:**
1. Go to Admin Dashboard → **Overview** or **Enrolments**
2. Click **"+ Enrol Student"** button
3. Select a student
4. Select a course
5. Click **"Enrol"**

**To enrol the same student in multiple courses:**
- Repeat steps 1-5, select the same student but different courses
- No duplicate enrolments will occur (unique constraint)

**Verify Multiple Enrolments:**
1. Go to **Users** tab
2. Click on a student (e.g., "Chidi Nwosu")
3. Click **"View Data"**
4. You'll see "Enrolled Courses: 4" (or however many you enrolled them in)
5. Expand each course to see performance in each

---

### Test 2: View Complete Student Data

1. Admin Dashboard → **Users** tab
2. Search for "Chidi Nwosu"
3. Click **"View Data"** button
4. You should see:
   - ✅ 4 Enrolled courses
   - ✅ Course performance for each course
   - ✅ Submissions, grades, attendance
   - ✅ Final result/grade per course
   - ✅ "Edit" buttons for grades and attendance

**Verify all data is populated:**
- Course Performance section shows 4 courses
- Each course shows: submissions, average grade, attendance rate, final result
- Edit buttons are visible and clickable

---

### Test 3: View Course with All Students

1. Admin Dashboard → **Courses** tab
2. Click **"View Students"** on any course
3. You should see:
   - ✅ All enrolled students in that course
   - ✅ Their submissions count
   - ✅ Average grades
   - ✅ Attendance numbers
   - ✅ Final grades

Example for CS 101:
- Chidi Nwosu: 2 submissions, avg grade 18.5, 5 attendance, grade A
- Amaka Obiora: 2 submissions, avg grade 16.5, 3 attendance, grade B
- Ikechukwu Obi: 2 submissions, avg grade 20, 3 attendance, grade A
- Zainab Ibrahim: 1 submission, avg grade 89.5, N/A attendance, grade A

---

### Test 4: View Lecturer Data

1. Admin Dashboard → **Users** tab
2. Search for "Dr. John Okafor"
3. Click **"View Data"**
4. You should see:
   - ✅ Lecturer profile
   - ✅ All courses taught (should be 2)
   - ✅ Student counts per course
   - ✅ Assignment counts
   - ✅ Submission statistics
   - ✅ Summary: Total Courses, Total Students, Total Assignments, Total Submissions

---

### Test 5: Edit Student Grades ✅ JUST FIXED

1. Go to **Users** tab
2. Click on "Chidi Nwosu" → **"View Data"**
3. Find a course under "Course Performance"
4. Scroll down to "Final Result"
5. Click **"Edit"** button
6. You should now see:
   - ✅ **Score** input field (editable)
   - ✅ **Letter Grade** dropdown (editable)
   - ✅ **Save Grade** button
7. Change the score to 95
8. Change grade to "A"
9. Click **"Save Grade"**
10. ✅ Should show success message

**Alternative: Edit from Course View**
1. Go to **Courses** tab
2. Click "View Students" on a course
3. Click **"Edit"** on any student in the table
4. ✅ Now shows editable score and grade fields
5. ✅ Has Save button

---

### Test 6: Edit Attendance

1. Go to **Users** tab
2. Click on a student → **"View Data"**
3. Under "Course Performance", find a course
4. You'll see "Attendance Summary" section
5. It shows: present/absent/late counts
6. Attendance records should be visible (from seed data)

---

### Test 7: Create New Lecturer

1. Go to Admin Dashboard → **Overview**
2. Click **"Create Lecturer"** button
3. Fill in:
   - Full Name: `Dr. Test User`
   - Email: `test@ilms.edu`
   - Password: `TestPass123!`
4. Click **"Create Lecturer"**
5. ✅ Should see success message
6. ✅ New lecturer appears in Users list

---

## Part 5: Data You Now Have

### Lecturers (3):
- **Dr. John Okafor**: Teaches CS 101, CS 201
- **Prof. Ada Eze**: Teaches CS 301
- **Dr. Emeka Nnamdi**: Teaches CS 102, MATH 201

### Students (5):
- **Chidi Nwosu**: Enrolled in CS 101, CS 301, CS 201, CS 102
- **Amaka Obiora**: Enrolled in CS 101, CS 301, MATH 201
- **Ikechukwu Obi**: Enrolled in CS 101, CS 201, CS 102
- **Blessing Okoro**: Enrolled in CS 301, CS 201
- **Zainab Ibrahim**: Enrolled in CS 101, CS 301

### Courses (5):
1. **CS 101** - Introduction to Programming (John Okafor) - 4 students
2. **CS 301** - Database Systems (Ada Eze) - 3 students
3. **CS 201** - Web Development (John Okafor) - 3 students
4. **CS 102** - Data Structures (Emeka Nnamdi) - 2 students
5. **MATH 201** - Discrete Mathematics (Emeka Nnamdi) - 1 student

### Data Per Course:
- **Assignments**: 2 per course (8 total)
- **Submissions**: 8 total (partially graded)
- **Attendance**: 15 records
- **Course Materials**: 10 resources
- **Results**: 9 final grades published

---

## Part 6: Troubleshooting

### Problem: "Can't find the View Data buttons"
**Solution:** 
- Make sure you're logged in as admin
- Make sure the user has `role='student'` or `role='lecturer'`

### Problem: "Enrol Student button doesn't show any students"
**Solution:**
- Verify students exist in users table
- Check they have `role='student'` and `is_active=true`

### Problem: "No courses appear in dropdown"
**Solution:**
- Verify courses were created
- Check `lecturer_id` is not null
- Run: `SELECT * FROM courses;` in Supabase

### Problem: "Edit grade form shows no input fields"
**Solution:**
- You should have this fixed with the latest AdminDashboard update
- Clear browser cache: `Ctrl+Shift+Delete`
- Restart frontend dev server

### Problem: "UUID errors when running SQL"
**Solution:**
- Make sure you replaced ALL placeholder UUIDs
- UUIDs must be valid format (36 characters with dashes)
- Check for typos in UUID values

### Problem: "Duplicate key violation" error
**Solution:**
- Some data might already exist
- Uncomment `DELETE FROM` lines at top of each section
- Or use new UUIDs

---

## Part 7: Common Admin Tasks

### Task 1: Enrol Student in New Course
```
Users → Student → View Data → (Course should appear if enrolled)
OR
Click "+ Enrol Student" → Select student and course → Enrol
```

### Task 2: Fix a Student's Grade
```
Users → Student → View Data → Course → Final Result → Edit → Change score → Save
```

### Task 3: Mark Attendance
```
Users → Student → View Data → Course → See attendance summary → Edit records
```

### Task 4: View Class Performance
```
Courses → Click "View Students" → See all students' performance at once
```

### Task 5: Add Grades to Submissions
```
(Would need submission viewing - coming in future)
OR
Edit via Student → Course → View submissions
```

---

## Part 8: Quick Reference

### Seed Data Contains:
| Item | Count | Details |
|------|-------|---------|
| Users | 9 | 1 admin, 3 lecturers, 5 students |
| Courses | 5 | Various CS and MATH courses |
| Enrolments | 16 | Multi-course enrollments |
| Attendance | 15 | Mix of present/absent/late |
| Assignments | 8 | 2 per course with due dates |
| Submissions | 8 | Partially graded |
| Results | 9 | Final grades published |
| Materials | 10 | Course resources by week |

### To Add More Data:
1. Modify `SEED_DATA.sql`
2. Duplicate a row and change:
   - UUID (make it unique)
   - Name/email
   - Relevant dates
3. Run the modified SQL again

---

## Part 9: Testing Checklist

- [ ] All 9 users created in auth
- [ ] Seed data runs without errors
- [ ] Verification queries show correct counts
- [ ] Can view student with 4 courses
- [ ] Can view lecturer with 2-3 courses
- [ ] Can edit student grade (fixed input boxes)
- [ ] Can enrol student in additional course
- [ ] Can view all students in a course
- [ ] Can see attendance records
- [ ] Can see submission grades

---

## Next Steps

After testing:
1. Create additional courses as needed
2. Enrol more students in courses
3. Add more assignments
4. Create more submissions and grade them
5. Mark attendance for ongoing sessions
6. Use the audit trail features (modified_by, modified_at)

---

**All set! Your database is now populated with realistic test data. Happy testing! 🎉**
