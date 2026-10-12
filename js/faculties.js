const FACULTY_OPTIONS = Object.freeze([
  { value: 'Công nghệ thông tin', label: 'Công nghệ thông tin' },
  { value: 'Kinh tế', label: 'Kinh tế' },
  { value: 'Điện - Điện tử', label: 'Điện - Điện tử' },
  { value: 'Cơ khí Ô tô', label: 'Cơ khí Ô tô' }
]);

function populateFacultySelect(select, allLabel) {
  const selectedValue = select.value || 'all';
  select.innerHTML = `<option value="all">${allLabel}</option>` +
    FACULTY_OPTIONS.map(faculty =>
      `<option value="${faculty.value}">${faculty.label}</option>`
    ).join('');

  if (FACULTY_OPTIONS.some(faculty => faculty.value === selectedValue)) {
    select.value = selectedValue;
  }
}

window.FACULTY_OPTIONS = FACULTY_OPTIONS;
window.populateFacultySelect = populateFacultySelect;
