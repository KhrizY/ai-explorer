// === AI 探险号 — 首页 ===

let coursesData = [];

async function init() {
  try {
    const res = await fetch('data/courses.json');
    const data = await res.json();
    coursesData = data.courses;
    renderCards();
  } catch (e) {
    document.getElementById('card-grid').innerHTML =
      '<p style="text-align:center;color:#FF6B6B;padding:40px;">课程数据加载失败，请刷新试试～</p>';
  }
}

function renderCards() {
  const grid = document.getElementById('card-grid');
  grid.innerHTML = coursesData.map(c => {
    const lock = c.placeholder || c.comingSoon;
    let badge = '';
    if (c.comingSoon) badge = '<span class="card-badge">即将推出</span>';
    else if (c.placeholder) badge = '<span class="card-badge">施工中</span>';

    return `
    <div class="course-card"
         onclick="${lock ? 'return' : `startCourse('${c.id}')`}"
         style="${lock ? 'opacity:0.5;cursor:default;' : ''}">
      ${badge}
      <div class="card-emoji">${c.emoji}</div>
      <div class="card-title">${c.title}</div>
      <div class="card-desc">${c.description}</div>
    </div>`;
  }).join('');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startCourse(courseId) {
  const course = coursesData.find(c => c.id === courseId);
  if (!course) return;
  document.getElementById('course-title-bar').textContent = course.emoji + ' ' + course.title;
  showPage('page-course');
  window.CoursePlayer.render(course);
}

function goHome() {
  showPage('page-home');
}

init();
