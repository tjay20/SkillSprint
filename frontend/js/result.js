const API_BASE = window.API_BASE_URL || "http://127.0.0.1:8000";

function getToken() {
  const raw = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  const cleaned = String(raw).trim().replace(/^"|"$/g, "");
  if (!cleaned || cleaned === "undefined" || cleaned === "null") {
    return "";
  }
  return cleaned;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(dateString) {
  if (!dateString) return "--";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function calculatePercentage(score, total) {
  if (!total || total === 0) return 0;
  return Math.round((score / total) * 100);
}

function animateProgressRing(percentage) {
  const circle = document.getElementById("progressCircle");
  if (!circle) return;
  
  const circumference = 2 * Math.PI * 95; // radius is 95
  const offset = circumference - (percentage / 100) * circumference;
  
  circle.style.strokeDashoffset = offset;
}

function showOfflineOverlay() {
  const overlay = document.getElementById("offlineOverlay");
  if (overlay) {
    overlay.style.display = "flex";
  }
}

function renderStudentResult(resultData) {
  // Student Info
  document.getElementById("studentName").textContent = resultData.name || "--";
  document.getElementById("studentEmail").textContent = resultData.email || "--";
  
  // Student Photo
  const photoImg = document.getElementById("studentPhoto");
  if (resultData.avatar_url) {
    photoImg.src = resultData.avatar_url;
  }
  
  // Student Details
  document.getElementById("detailSRN").textContent = resultData.srn || "--";
  document.getElementById("detailPRN").textContent = resultData.prn || "--";
  document.getElementById("detailClass").textContent = resultData.division || "--";
  document.getElementById("detailYear").textContent = resultData.year || "--";
  document.getElementById("detailBranch").textContent = resultData.branch || "--";
  document.getElementById("detailRollNo").textContent = resultData.roll_no || "--";
  
  // Score Info
  const percentage = calculatePercentage(resultData.score, resultData.total_questions);
  document.getElementById("scorePercentage").textContent = `${percentage}%`;
  document.getElementById("breakdownScore").textContent = resultData.score;
  document.getElementById("breakdownTotal").textContent = resultData.total_questions;
  document.getElementById("breakdownDate").textContent = formatDate(resultData.submitted_at);
  
  // Animate progress ring
  animateProgressRing(percentage);
}

async function loadStudentResult() {
  const token = getToken();
  
  if (!token) {
    console.error("No authentication token found");
    window.location.href = "login.html";
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/results/me`, {
      method: "GET",
      headers: authHeaders(),
    });
    
    if (response.status === 403) {
      // Results are offline
      showOfflineOverlay();
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to load result");
    }
    
    const resultData = await response.json();
    renderStudentResult(resultData);
    
  } catch (error) {
    console.error("Error loading result:", error);
    alert("Failed to load your result. Please try again later.");
    window.location.href = "student-dashboard.html";
  }
}

function downloadPDF() {
  const studentName = document.getElementById("studentName").textContent;
  const fileName = `SkillSprint_Result_${studentName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
  
  // Use browser's print dialog with PDF save
  const originalTitle = document.title;
  document.title = fileName;
  
  window.print();
  
  // Restore title after a delay
  setTimeout(() => {
    document.title = originalTitle;
  }, 100);
}

// Initialize
document.addEventListener("DOMContentLoaded", function() {
  const downloadBtn = document.getElementById("downloadPdfBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadPDF);
  }
  
  loadStudentResult();
});
