// --- Tab Navigation ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tabContents.forEach(tc => tc.style.display = 'none');
    document.getElementById(btn.dataset.tab).style.display = 'block';
  });
});
// Set default tab
if (tabBtns[0]) tabBtns[0].click();

// --- Local Storage Helpers ---
function getStudents() {
  return JSON.parse(localStorage.getItem('students') || '[]');
}
function setStudents(students) {
  localStorage.setItem('students', JSON.stringify(students));
}
function getAttendance() {
  return JSON.parse(localStorage.getItem('attendance') || '{}');
}
function setAttendance(att) {
  localStorage.setItem('attendance', JSON.stringify(att));
}

// --- Add Student ---
const addStudentForm = document.getElementById('addStudentForm');
addStudentForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(addStudentForm));
  const students = getStudents();
  data.id = Date.now().toString();
  students.push(data);
  setStudents(students);
  addStudentForm.reset();
  alert('Student added!');
  renderStudentsTable();
  renderAttendanceTable();
  renderReportsTable();
});

// --- Manage Students ---
const studentsTableBody = document.querySelector('#studentsTable tbody');
const filterClass = document.getElementById('filterClass');

function renderStudentsTable() {
  const students = getStudents();
  const filter = filterClass.value;
  studentsTableBody.innerHTML = '';
  students.filter(s => !filter || s.class === filter).forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.enrollment}</td>
      <td>${s.father}</td>
      <td>${s.cnic || ''}</td>
      <td>${s.email}</td>
      <td>${s.mobile}</td>
      <td>${s.class}</td>
      <td><button class="edit-btn" data-id="${s.id}">✏️</button></td>
      <td><button class="delete-btn" data-id="${s.id}">🗑️</button></td>
    `;
    studentsTableBody.appendChild(tr);
  });
}
filterClass.addEventListener('change', renderStudentsTable);
studentsTableBody.addEventListener('click', function(e) {
  if (e.target.classList.contains('delete-btn')) {
    if (confirm('Delete this student?')) {
      const id = e.target.dataset.id;
      let students = getStudents();
      students = students.filter(s => s.id !== id);
      setStudents(students);
      renderStudentsTable();
      renderAttendanceTable();
      renderReportsTable();
    }
  } else if (e.target.classList.contains('edit-btn')) {
    openEditModal(e.target.dataset.id);
  }
});
function openEditModal(id) {
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editStudentForm');
  const student = getStudents().find(s => s.id === id);
  if (!student) return;
  for (const key in student) {
    if (form.elements[key]) form.elements[key].value = student[key];
  }
  modal.style.display = 'flex';
}
document.getElementById('closeEditModal').onclick = () => {
  document.getElementById('editModal').style.display = 'none';
};
document.getElementById('editStudentForm').onsubmit = function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  let students = getStudents();
  students = students.map(s => s.id === data.id ? {...s, ...data} : s);
  setStudents(students);
  document.getElementById('editModal').style.display = 'none';
  renderStudentsTable();
  renderAttendanceTable();
  renderReportsTable();
};

// --- Mark Attendance ---
const attendanceClass = document.getElementById('attendanceClass');
const attendanceSubject = document.getElementById('attendanceSubject');
const attendanceDate = document.getElementById('attendanceDate');
const attendanceTableBody = document.querySelector('#attendanceTable tbody');
const attendanceForm = document.getElementById('attendanceForm');

// Update subject dropdown when class is selected
attendanceClass.addEventListener('change', () => {
  const selectedClass = attendanceClass.value;
  const config = getClassConfig();
  attendanceSubject.innerHTML = '<option value="">Select Subject</option>';
  
  if (selectedClass && config[selectedClass]) {
    config[selectedClass].forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.name;
      option.textContent = `${subject.name} (${subject.teacher})`;
      attendanceSubject.appendChild(option);
    });
  }
  attendanceTableBody.innerHTML = '';
});

// Update attendance table when subject is selected
attendanceSubject.addEventListener('change', renderAttendanceTable);

function renderAttendanceTable() {
  const cls = attendanceClass.value;
  const subject = attendanceSubject.value;
  if (!cls || !subject) {
    attendanceTableBody.innerHTML = '';
    return;
  }

  const students = getStudents();
  attendanceTableBody.innerHTML = '';
  
  students.filter(s => s.class === cls).forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.enrollment}</td>
      <td><input type="radio" name="att_${s.id}" value="Present" required></td>
      <td><input type="radio" name="att_${s.id}" value="Absent"></td>
      <td><input type="radio" name="att_${s.id}" value="Leave"></td>
    `;
    attendanceTableBody.appendChild(tr);
  });
}

attendanceDate.valueAsDate = new Date();

attendanceForm.onsubmit = function(e) {
  e.preventDefault();
  const cls = attendanceClass.value;
  const subject = attendanceSubject.value;
  const date = attendanceDate.value;
  
  if (!cls || !subject || !date) {
    alert('Please select class, subject and date!');
    return;
  }
  
  const students = getStudents().filter(s => s.class === cls);
  const att = getAttendance();
  
  if (!att[date]) att[date] = {};
  if (!att[date][subject]) att[date][subject] = {};
  
  students.forEach(s => {
    const status = attendanceForm[`att_${s.id}`].value;
    att[date][subject][s.id] = status;
  });
  
  setAttendance(att);
  alert('Attendance saved!');
  renderReportsTable();
};

// --- Attendance Reports ---
const reportClass = document.getElementById('reportClass');
const reportSubject = document.getElementById('reportSubject');
const reportsTableBody = document.querySelector('#reportsTable tbody');

// Update subject dropdown in reports when class is selected
reportClass.addEventListener('change', () => {
  const selectedClass = reportClass.value;
  const config = getClassConfig();
  reportSubject.innerHTML = '<option value="">All Subjects</option>';
  
  if (selectedClass && config[selectedClass]) {
    config[selectedClass].forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.name;
      option.textContent = `${subject.name} (${subject.teacher})`;
      reportSubject.appendChild(option);
    });
  }
  renderReportsTable();
});

reportSubject.addEventListener('change', renderReportsTable);

function renderReportsTable() {
  const selectedClass = reportClass.value;
  const selectedSubject = reportSubject.value;
  const students = getStudents();
  const att = getAttendance();
  const filteredStudents = selectedClass ? students.filter(s => s.class === selectedClass) : students;
  
  // Calculate summary
  const summary = {};
  
  for (const date in att) {
    for (const subject in att[date]) {
      if (selectedSubject && subject !== selectedSubject) continue;
      
      for (const sid in att[date][subject]) {
        if (!summary[`${sid}_${subject}`]) {
          summary[`${sid}_${subject}`] = {Present: 0, Absent: 0, Leave: 0, total: 0};
        }
        summary[`${sid}_${subject}`][att[date][subject][sid]]++;
        summary[`${sid}_${subject}`].total++;
      }
    }
  }
  
  reportsTableBody.innerHTML = '';
  
  filteredStudents.forEach(s => {
    const subjects = selectedSubject ? [selectedSubject] : 
                    (getClassConfig()[s.class] || []).map(sub => sub.name);
    
    subjects.forEach(subject => {
      const sum = summary[`${s.id}_${subject}`] || {Present: 0, Absent: 0, Leave: 0, total: 0};
      const attendancePercentage = sum.total ? ((sum.Present / sum.total) * 100).toFixed(1) : 'N/A';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${s.enrollment}</td>
        <td>${s.class}</td>
        <td>${subject}</td>
        <td>${sum.Present}</td>
        <td>${sum.Absent}</td>
        <td>${sum.Leave}</td>
        <td>${attendancePercentage}%</td>
      `;
      reportsTableBody.appendChild(tr);
    });
  });
}

document.getElementById('downloadCSV').onclick = function() {
  const selectedClass = reportClass.value;
  const selectedSubject = reportSubject.value;
  const students = getStudents();
  const att = getAttendance();
  const filteredStudents = selectedClass ? students.filter(s => s.class === selectedClass) : students;
  
  // Build CSV header
  let csv = 'Name,Enrollment,Class,Subject,Total Present,Total Absent,Total Leave,Attendance %\n';
  
  // Calculate summary
  const summary = {};
  for (const date in att) {
    for (const subject in att[date]) {
      if (selectedSubject && subject !== selectedSubject) continue;
      
      for (const sid in att[date][subject]) {
        if (!summary[`${sid}_${subject}`]) {
          summary[`${sid}_${subject}`] = {Present: 0, Absent: 0, Leave: 0, total: 0};
        }
        summary[`${sid}_${subject}`][att[date][subject][sid]]++;
        summary[`${sid}_${subject}`].total++;
      }
    }
  }
  
  filteredStudents.forEach(s => {
    const subjects = selectedSubject ? [selectedSubject] : 
                    (getClassConfig()[s.class] || []).map(sub => sub.name);
    
    subjects.forEach(subject => {
      const sum = summary[`${s.id}_${subject}`] || {Present: 0, Absent: 0, Leave: 0, total: 0};
      const attendancePercentage = sum.total ? ((sum.Present / sum.total) * 100).toFixed(1) : 'N/A';
      
      csv += `"${s.name}","${s.enrollment}","${s.class}","${subject}",${sum.Present},${sum.Absent},${sum.Leave},${attendancePercentage}%\n`;
    });
  });
  
  // Download
  const blob = new Blob([csv], {type: 'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'attendance_report.csv';
  a.click();
};

// --- Class and Subject Management ---
function getClassConfig() {
  return JSON.parse(localStorage.getItem('classConfig') || '{}');
}

function setClassConfig(config) {
  localStorage.setItem('classConfig', JSON.stringify(config));
}

function createSubjectEntry() {
  const div = document.createElement('div');
  div.className = 'subject-entry';
  div.innerHTML = `
    <input type="text" class="subject-name" placeholder="Subject Name" required>
    <div class="teacher-name">
      <input type="text" class="teacher-name-input" placeholder="Teacher Name" required>
      <button type="button" class="edit-teacher-btn" title="Edit Teacher Name">✎</button>
    </div>
    <button class="remove-subject" type="button">&times;</button>
  `;

  // Handle teacher name editing
  const teacherInput = div.querySelector('.teacher-name-input');
  const teacherContainer = div.querySelector('.teacher-name');
  const editBtn = div.querySelector('.edit-teacher-btn');
  
  // Initially disable the teacher input
  teacherInput.disabled = true;
  
  editBtn.addEventListener('click', () => {
    if (teacherInput.disabled) {
      // Enable editing
      teacherInput.disabled = false;
      teacherInput.focus();
      teacherContainer.classList.add('editing');
      editBtn.textContent = '✓';
      editBtn.title = 'Save Teacher Name';
    } else {
      // Save changes
      teacherInput.disabled = true;
      teacherContainer.classList.remove('editing');
      editBtn.textContent = '✎';
      editBtn.title = 'Edit Teacher Name';
      
      // If we're editing an existing subject, update the class config
      const selectedClass = selectClass.value;
      const subjectName = div.querySelector('.subject-name').value;
      if (selectedClass && subjectName) {
        const config = getClassConfig();
        if (config[selectedClass]) {
          const subject = config[selectedClass].find(s => s.name === subjectName);
          if (subject) {
            subject.teacher = teacherInput.value;
            setClassConfig(config);
          }
        }
      }
    }
  });

  div.querySelector('.remove-subject').onclick = () => div.remove();
  return div;
}

const subjectsList = document.getElementById('subjectsList');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const saveClassBtn = document.getElementById('saveClassBtn');
const selectClass = document.getElementById('selectClass');

addSubjectBtn.onclick = () => {
  subjectsList.appendChild(createSubjectEntry());
};

selectClass.onchange = () => {
  const selectedClass = selectClass.value;
  const config = getClassConfig();
  subjectsList.innerHTML = '';
  
  if (selectedClass && config[selectedClass]) {
    config[selectedClass].forEach(subject => {
      const entry = createSubjectEntry();
      const subjectInput = entry.querySelector('.subject-name');
      const teacherInput = entry.querySelector('.teacher-name-input');
      
      subjectInput.value = subject.name;
      teacherInput.value = subject.teacher;
      
      // Disable subject name editing for existing subjects
      subjectInput.disabled = true;
      
      subjectsList.appendChild(entry);
    });
  } else {
    // Add one empty subject entry for new class
    subjectsList.appendChild(createSubjectEntry());
  }
};

saveClassBtn.onclick = () => {
  const selectedClass = selectClass.value;
  if (!selectedClass) {
    alert('Please select a class first!');
    return;
  }

  const subjects = [];
  const entries = subjectsList.querySelectorAll('.subject-entry');
  
  for (const entry of entries) {
    const subjectName = entry.querySelector('.subject-name').value.trim();
    const teacherName = entry.querySelector('.teacher-name-input').value.trim();
    
    if (!subjectName || !teacherName) {
      alert('Please fill in all subject and teacher names!');
      return;
    }
    
    subjects.push({
      name: subjectName,
      teacher: teacherName
    });
  }

  const config = getClassConfig();
  config[selectedClass] = subjects;
  setClassConfig(config);
  alert('Class configuration saved successfully!');
};

// Add initial empty subject entry
subjectsList.appendChild(createSubjectEntry());

// --- Initial Render ---
renderStudentsTable();
renderAttendanceTable();
renderReportsTable(); 