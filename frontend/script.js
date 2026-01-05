// script.js
// SPA behavior + Node.js backend integration

const API = "http://localhost:5000/api";

/* ---------------- SELECTORS ---------------- */
const selectors = {
  sidebar: document.getElementById("sidebar"),
  hamburger: document.getElementById("hamburger"),
  loginBtn: document.getElementById("loginBtn"),
  heroLogin: document.getElementById("heroLogin"),
  ctaSearch: document.getElementById("ctaSearch"),
  ctaCreate: document.getElementById("ctaCreate"),
  modalOverlay: document.getElementById("modalOverlay"),
  modal: document.getElementById("modal"),
  welcomeText: document.getElementById("welcomeText"),
  pages: document.querySelectorAll(".page"),
  navButtons: Array.from(document.querySelectorAll(".nav-btn")),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  alumniListEl: document.getElementById("alumniList"),
  bookingsList: document.getElementById("bookingsList"),
  profileInfo: document.getElementById("profileInfo"),
  bookmarkedList: document.getElementById("bookmarkedList")
};

const templates = {
  alumniCard: document.getElementById("alumniCardTpl")
};

/* ---------------- STATE ---------------- */
let state = {
  student: null,
  alumni: [],
  bookings: [],
  bookmarks: []
};

/* ---------------- INIT ---------------- */
async function init() {
  selectors.hamburger.onclick = toggleSidebar;
  selectors.loginBtn.onclick = openLoginModal;
  selectors.heroLogin.onclick = openLoginModal;
  selectors.ctaSearch.onclick = () => navigateTo("search");
  selectors.ctaCreate.onclick = () => navigateTo("createAlumni");
  selectors.navButtons.forEach(b => b.onclick = () => navigateTo(b.dataset.route));
  selectors.searchBtn.onclick = handleSearch;

  document.getElementById("saveStudent").onclick = saveStudentFromForm;
  document.getElementById("toHome").onclick = () => navigateTo("home");
  document.getElementById("saveAlumni").onclick = saveAlumniFromForm;
  document.getElementById("clearAlumni").onclick = clearAlumniForm;

  selectors.modalOverlay.onclick = e => {
    if (e.target === selectors.modalOverlay) closeModal();
  };

  await loadInitialData();
}
window.onload = init;

/* ---------------- LOAD DATA ---------------- */
async function loadInitialData() {
  try {
    state.alumni = await fetch(`${API}/alumni`).then(r => r.json());
    state.bookings = await fetch(`${API}/bookings`).then(r => r.json());
    state.bookmarks = await fetch(`${API}/bookmarks`).then(r => r.json());
    renderAlumniList(state.alumni);
    renderBookings();
    renderProfile();
  } catch {
    alert("Backend server is not running");
  }
}

/* ---------------- SIDEBAR ---------------- */
function toggleSidebar() {
  selectors.sidebar.classList.toggle("open");
}

/* ---------------- ROUTING ---------------- */
function navigateTo(route) {
  selectors.pages.forEach(p => p.classList.remove("show"));
  document.getElementById(route)?.classList.add("show");
  if (selectors.sidebar.classList.contains("open")) toggleSidebar();
}

/* ---------------- LOGIN ---------------- */
function openLoginModal() {
  openModal(`
    <h3>Student Login</h3>
    <input id="mName" placeholder="Name" />
    <input id="mCollege" placeholder="College" />
    <div style="margin-top:10px">
      <button id="mLogin" class="btn btn-primary">Login</button>
      <button id="mCancel" class="btn btn-outline">Cancel</button>
    </div>
  `);

  document.getElementById("mLogin").onclick = async () => {
    const name = document.getElementById("mName").value.trim();
    const college = document.getElementById("mCollege").value.trim();
    if (!name || !college) return alert("Fill all fields");

    const res = await fetch(`${API}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, college })
    });

    state.student = await res.json();
    updateWelcome();
    closeModal();
  };

  document.getElementById("mCancel").onclick = closeModal;
}

function saveStudentFromForm() {
  alert("Please login using the Login button");
}

function updateWelcome() {
  if (!state.student) return;
  selectors.welcomeText.textContent = `Hi, ${state.student.name}`;
  document.getElementById("heroWelcome").textContent = `Welcome, ${state.student.name}`;
  document.getElementById("heroSub").textContent = state.student.college;
  selectors.loginBtn.style.display = "none";
}

/* ---------------- ALUMNI ---------------- */
async function saveAlumniFromForm() {
  const alumni = {
    name: alumnName.value.trim(),
    company: alumnCompany.value.trim(),
    role: alumnRole.value.trim(),
    timing: alumnTiming.value.trim(),
    skills: alumnSkills.value.split(",").map(s => s.trim()).filter(Boolean),
    fees: alumnFees.value || "Free",
    certs: alumnCerts.value.split(",").map(c => c.trim()).filter(Boolean)
  };

  if (!alumni.name || alumni.skills.length === 0)
    return alert("Name and skills required");

  await fetch(`${API}/alumni`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alumni)
  });

  alert("Alumni saved");
  clearAlumniForm();
  state.alumni = await fetch(`${API}/alumni`).then(r => r.json());
  renderAlumniList(state.alumni);
  navigateTo("search");
}

function clearAlumniForm() {
  ["alumnName","alumnCompany","alumnRole","alumnTiming","alumnSkills","alumnFees","alumnCerts"]
    .forEach(id => document.getElementById(id).value = "");
}

/* ---------------- RENDER ALUMNI ---------------- */
function renderAlumniList(list) {
  selectors.alumniListEl.innerHTML = "";
  if (!list.length) {
    selectors.alumniListEl.innerHTML = "<p>No alumni found</p>";
    return;
  }

  list.forEach(alum => {
    const node = templates.alumniCard.content.cloneNode(true);
    node.querySelector(".alumn-name").textContent = alum.name;
    node.querySelector(".alumn-meta").textContent = `${alum.role || ""} • ${alum.company || ""}`;
    node.querySelector(".alumn-fees").textContent = `Fee: ${alum.fees || "Free"}`;

    const skillsWrap = node.querySelector(".alumn-skills");
    (alum.skills || []).forEach(s => {
      const span = document.createElement("span");
      span.className = "skill";
      span.textContent = s;
      skillsWrap.appendChild(span);
    });

    node.querySelector(".book-btn").onclick = () => openBookingModal(alum);

    node.querySelector(".bookmark-btn").onclick = async () => {
      await fetch(`${API}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId: alum.id })
      });
      alert("Bookmarked");
    };

    selectors.alumniListEl.appendChild(node);
  });
}

/* ---------------- BOOKING ---------------- */
function openBookingModal(alum) {
  openModal(`
    <h3>Book ${alum.name}</h3>
    <button id="confirmBook" class="btn btn-primary">Confirm</button>
    <button id="cancelBook" class="btn btn-outline">Cancel</button>
  `);

  document.getElementById("confirmBook").onclick = async () => {
    if (!state.student) return alert("Login required");

    await fetch(`${API}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alumniId: alum.id,
        alumniName: alum.name,
        studentId: state.student.id,
        studentName: state.student.name,
        studentCollege: state.student.college,
        slot: new Date().toISOString(),
        fee: alum.fees
      })
    });

    closeModal();
    state.bookings = await fetch(`${API}/bookings`).then(r => r.json());
    renderBookings();
  };

  document.getElementById("cancelBook").onclick = closeModal;
}

/* ---------------- BOOKINGS LIST ---------------- */
function renderBookings() {
  selectors.bookingsList.innerHTML = "";
  state.bookings.forEach(b => {
    const div = document.createElement("div");
    div.className = "booking-card";
    div.innerHTML = `
      <strong>${b.alumniName}</strong>
      <div>${new Date(b.slot).toLocaleString()}</div>
      <button class="btn btn-outline">Cancel</button>
    `;

    div.querySelector("button").onclick = async () => {
      await fetch(`${API}/bookings/${b.id}`, { method: "DELETE" });
      state.bookings = state.bookings.filter(x => x.id !== b.id);
      renderBookings();
    };

    selectors.bookingsList.appendChild(div);
  });
}

/* ---------------- PROFILE ---------------- */
function renderProfile() {
  selectors.profileInfo.innerHTML = state.student
    ? `<strong>${state.student.name}</strong><div>${state.student.college}</div>`
    : "<p>Not logged in</p>";
}

/* ---------------- SEARCH ---------------- */
async function handleSearch() {
  const q = selectors.searchInput.value.trim();
  const res = await fetch(`${API}/alumni/search?q=${q}`);
  const data = await res.json();
  renderAlumniList(data);
  navigateTo("search");
}

/* ---------------- MODAL ---------------- */
function openModal(html) {
  selectors.modal.innerHTML = html;
  selectors.modalOverlay.classList.remove("hidden");
}
function closeModal() {
  selectors.modal.innerHTML = "";
  selectors.modalOverlay.classList.add("hidden");
}
