"use strict";

const SUPABASE_URL = "https://amqlgdiiosmhntstuajl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BLs1lpBBBOsXPSyqfRJHhQ_tY0azVsR";
const TABLE_NAME = "daily_marketing_reports";

const db = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

let currentData = [];

const tableBody = document.getElementById("tableBody");
const recordCount = document.getElementById("recordCount");
const exportExcelBtn = document.getElementById("exportExcelBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const refreshBtn = document.getElementById("refreshBtn");

function formatRs(value) {
  const num = Number(value) || 0;
  return `Rs. ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(num)}`;
}

async function fetchReports() {
  if (!db) {
    tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-600 font-medium">Supabase library failed to load.</td></tr>`;
    return;
  }

  tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-3 text-gray-400"></i>Fetching records...</td></tr>`;
  if (window.lucide) window.lucide.createIcons();

  try {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('*')
      .order('visit_date', { ascending: false }); // Sort by newest visit date first

    if (error) throw error;

    currentData = data || [];
    renderTable();

  } catch (error) {
    console.error("Error fetching data:", error);
    tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-600 font-medium">Could not load reports. Did you enable the Supabase SELECT policy?</td></tr>`;
  }
}

function renderTable() {
  recordCount.textContent = `Showing ${currentData.length} report${currentData.length === 1 ? '' : 's'}`;

  if (currentData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">No reports found in the database.</td></tr>`;
    return;
  }

  tableBody.innerHTML = currentData.map(row => `
    <tr class="hover:bg-gray-50 transition-colors">
      <td class="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">${row.visit_date}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-gray-900 font-medium">${row.executive_name}</div>
        <div class="text-gray-500 text-xs">${row.designation}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-600">${row.post_office}</td>
      <td class="px-6 py-4">
        <div class="text-gray-900 font-medium">${row.institution_name}</div>
        <div class="text-gray-500 text-xs">${row.phone_no}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-gray-600">${row.visited_category}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right font-bold text-[#D71920]">
        ${formatRs(row.total_revenue)}
      </td>
    </tr>
  `).join('');
}

/* =========================================================
   EXCEL EXPORT (Using SheetJS)
========================================================= */
function exportToExcel() {
  if (!currentData.length) return alert("No data to export.");

  // Map database columns to clean Excel headers
  const exportData = currentData.map(row => ({
    "Visit Date": row.visit_date,
    "Executive Name": row.executive_name,
    "Designation": row.designation,
    "Reporting Office": row.post_office,
    "Nearest BO": row.nearest_bo || "-",
    "Category": row.visited_category,
    "BPM/ABPM Accompanied": row.bpm_accompanied,
    "Institution/Customer": row.institution_name,
    "Mobile": row.phone_no,
    "POSB Opened": row.posb_count,
    "TD Opened": row.td_count,
    "SSA Opened": row.ssa_count,
    "RD Opened": row.rd_count,
    "PLI Amount (Rs)": row.pli_amount,
    "RPLI Amount (Rs)": row.rpli_amount,
    "Parcel Amount (Rs)": row.parcel_amount,
    "Total Est. Revenue (Rs)": row.total_revenue,
    "Expected Business (Rs)": row.expected_business,
    "Follow-up Date": row.followup_date || "-"
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Marketing Reports");
  
  const dateStr = new Date().toISOString().slice(0,10);
  XLSX.writeFile(workbook, `IndiaPost_Reports_${dateStr}.xlsx`);
}

/* =========================================================
   PDF EXPORT (Master Table)
========================================================= */
function exportToPdf() {
  if (!currentData.length) return alert("No data to export.");

  const jsPDF = window.jspdf?.jsPDF;
  if (jsPDF) window.jsPDF = jsPDF; 

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  
  doc.setFillColor(127, 17, 24); // Deep red header
  doc.rect(0, 0, 300, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("INDIA POST - DAILY MARKETING REPORTS", 14, 14);

  const tableBodyData = currentData.map(row => [
    row.visit_date,
    row.executive_name,
    row.post_office,
    row.institution_name,
    row.visited_category,
    `Rs. ${row.expected_business}`,
    `Rs. ${row.total_revenue}`
  ]);

  doc.autoTable({
    startY: 28,
    head: [["Date", "Executive", "Office", "Customer", "Category", "Expected Biz", "Est. Revenue"]],
    body: tableBodyData,
    theme: "grid",
    headStyles: { fillColor: [215, 25, 32], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 }
  });

  const dateStr = new Date().toISOString().slice(0,10);
  doc.save(`IndiaPost_Reports_Summary_${dateStr}.pdf`);
}

// Event Listeners
exportExcelBtn?.addEventListener("click", exportToExcel);
exportPdfBtn?.addEventListener("click", exportToPdf);
refreshBtn?.addEventListener("click", fetchReports);

// Init
document.addEventListener("DOMContentLoaded", () => {
  fetchReports();
  if (window.lucide) window.lucide.createIcons();
});
