
"use strict";

/* -------------------------------------------------------
   SUPABASE CONFIGURATION
   The publishable key is intended for browser-side use.
   Never put a service_role or secret key in this file.
------------------------------------------------------- */

const SUPABASE_URL = "https://amqlgdiiosmhntstuajl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BLs1lpBBBOsXPSyqfRJHhQ_tY0azVsR";

const TABLE_NAME = "daily_marketing_reports";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

/* -------------------------------------------------------
   DOM HELPERS
------------------------------------------------------- */

const form = document.getElementById("marketingForm");
const submitButton = document.getElementById("submitButton");
const pdfButton = document.getElementById("pdfButton");
const resetButton = document.getElementById("resetButton");
const statusElement = document.getElementById("formStatus");

const $ = (id) => document.getElementById(id);

function getValue(id) {
  return $(id)?.value?.trim() ?? "";
}

function getNumber(id) {
  const value = getValue(id);
  if (value === "") return 0;

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function setStatus(message, type = "info") {
  statusElement.textContent = message;
  statusElement.className = `form-status ${type}`;
}

function clearStatus() {
  statusElement.textContent = "";
  statusElement.className = "form-status";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* -------------------------------------------------------
   DATE PICKERS
------------------------------------------------------- */

function openDatePicker(fieldId) {
  const input = $(fieldId);
  if (!input) return;

  try {
    input.focus({ preventScroll: true });

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  } catch (error) {
    input.focus();
    input.click();
  }
}

document.querySelectorAll("[data-date-target]").forEach((button) => {
  button.addEventListener("click", () => {
    openDatePicker(button.dataset.dateTarget);
  });
});

/* -------------------------------------------------------
   CONDITIONAL FIELDS
------------------------------------------------------- */

function updateCategoryField() {
  const isOther = getValue("visited_category") === "Others";
  const wrapper = $("categoryOtherWrap");
  const input = $("category_other");

  wrapper.classList.toggle("hidden", !isOther);
  input.required = isOther;

  if (!isOther) {
    input.value = "";
    clearFieldError(input);
  }
}

function updateFollowupField() {
  const required = getValue("followup_reqd") === "Yes";
  const wrapper = $("followupDateWrap");
  const input = $("followup_date");

  wrapper.classList.toggle("hidden", !required);
  input.required = required;

  if (!required) {
    input.value = "";
    clearFieldError(input);
  }
}

$("visited_category").addEventListener("change", updateCategoryField);
$("followup_reqd").addEventListener("change", updateFollowupField);

/* -------------------------------------------------------
   FIELD VALIDATION
------------------------------------------------------- */

function fieldErrorElement(input) {
  const field = input.closest(".field");
  return field ? field.querySelector(".field-error") : null;
}

function showFieldError(input, message) {
  const error = fieldErrorElement(input);
  input.setAttribute("aria-invalid", "true");

  if (error) {
    error.textContent = message;
  }
}

function clearFieldError(input) {
  const error = fieldErrorElement(input);
  input.removeAttribute("aria-invalid");

  if (error) {
    error.textContent = "";
  }
}

function validateSingleField(input) {
  if (!input || input.disabled) return true;

  if (input.id === "category_other" &&
      getValue("visited_category") !== "Others") {
    clearFieldError(input);
    return true;
  }

  if (input.id === "followup_date" &&
      getValue("followup_reqd") !== "Yes") {
    clearFieldError(input);
    return true;
  }

  const value = input.value.trim();
  let error = "";

  if (input.required && value === "") {
    error = "This field is required.";
  }

  if (!error && input.id === "executive_name" && value) {
    // Unicode letters, spaces, apostrophes, periods and hyphens.
    if (!/^[\p{L}\p{M} .'-]+$/u.test(value)) {
      error = "Use letters, spaces, apostrophes, periods or hyphens only.";
    }
  }

  if (!error && input.id === "institution_name" && value) {
    if (value.length < 2) {
      error = "Enter a valid institution or customer name.";
    }
  }

  if (!error && input.id === "phone_no" && value) {
    if (!/^[6-9]\d{9}$/.test(value)) {
      error = "Enter a valid 10-digit Indian mobile number starting with 6–9.";
    }
  }

  if (!error && input.type === "number" && value !== "") {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      error = "Enter a valid number.";
    } else if (number < 0) {
      error = "Negative values are not allowed.";
    } else if (input.step === "1" && !Number.isInteger(number)) {
      error = "Enter a whole number.";
    }
  }

  if (!error && input.id === "visit_date" && value) {
    const visitDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(visitDate.getTime())) {
      error = "Enter a valid visit date.";
    }
  }

  if (!error && input.id === "followup_date" && value) {
    const visitValue = getValue("visit_date");

    if (visitValue && value < visitValue) {
      error = "Follow-up date cannot be before the visit date.";
    }
  }

  if (!error && input.id === "followup_date" &&
      getValue("followup_reqd") === "Yes" && !value) {
    error = "Select a follow-up date.";
  }

  if (error) {
    showFieldError(input, error);
    return false;
  }

  clearFieldError(input);
  return true;
}

function validateForm() {
  updateCategoryField();
  updateFollowupField();

  let isValid = true;
  let firstInvalid = null;

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    if (input.type === "button" || input.type === "submit") return;
    if (input.closest(".hidden")) return;

    if (!validateSingleField(input)) {
      isValid = false;
      firstInvalid ??= input;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return isValid;
}

form.querySelectorAll("input, select, textarea").forEach((input) => {
  input.addEventListener("blur", () => validateSingleField(input));

  input.addEventListener("input", () => {
    if (input.hasAttribute("aria-invalid")) {
      validateSingleField(input);
    }
    if (input.type === "number" || input.id === "visit_date") {
      updateRevenueDisplay();
    }
  });

  input.addEventListener("change", () => {
    validateSingleField(input);
    updateRevenueDisplay();
  });
});

/* -------------------------------------------------------
   REVENUE CALCULATIONS
------------------------------------------------------- */

function calculateRevenue() {
  const accountsCount =
    getNumber("posb_count") +
    getNumber("td_count") +
    getNumber("ssa_count") +
    getNumber("rd_count");

  const revenue = {
    accounts: accountsCount * 219,
    pli: getNumber("pli_amount") * 0.04,
    rpli: getNumber("rpli_amount") * 0.12,
    parcel: getNumber("parcel_amount"),
    documents: getNumber("document_amount"),
    logistics: getNumber("logistics_amount") * 0.20,
    aadhaar: getNumber("aadhaar_amount") * 0.82,
    kvic: getNumber("kvic_verification") * 3540 * 0.82
  };

  revenue.total = Object.values(revenue).reduce(
    (sum, value) => sum + value, 0
  );

  return revenue;
}

function updateRevenueDisplay() {
  const revenue = calculateRevenue();

  const rows = [
    ["Savings accounts", revenue.accounts],
    ["PLI revenue estimate (4%)", revenue.pli],
    ["RPLI revenue estimate (12%)", revenue.rpli],
    ["Parcel bookings", revenue.parcel],
    ["Document / Speed Post", revenue.documents],
    ["Logistics revenue estimate (20%)", revenue.logistics],
    ["Aadhaar revenue estimate (82%)", revenue.aadhaar],
    ["KVIC revenue estimate (82%)", revenue.kvic]
  ];

  $("revenueBreakdown").innerHTML = rows.map(([label, amount]) => `
    <div class="revenue-line">
      <span>${escapeHtml(label)}</span>
      <strong>${formatINR(amount)}</strong>
    </div>
  `).join("");

  $("totalRevenueDisplay").textContent = formatINR(revenue.total);

  return revenue;
}

/* -------------------------------------------------------
   FORM DATA
------------------------------------------------------- */

function buildPayload() {
  const revenue = calculateRevenue();

  // Store "Others: <specified category>" in the existing
  // visited_category field, avoiding a separate DB column.
  let visitedCategory = getValue("visited_category");

  if (visitedCategory === "Others") {
    const specified = getValue("category_other");
    visitedCategory = specified ? `Others: ${specified}` : "Others";
  }

  const payload = {
    executive_name: getValue("executive_name"),
    designation: getValue("designation"),
    post_office: getValue("post_office"),
    nearest_bo: getValue("nearest_bo") || null,
    visit_date: getValue("visit_date"),
    visited_category: visitedCategory,
    bpm_accompanied: getValue("bpm_accompanied") || "No",

    institution_name: getValue("institution_name"),
    phone_no: getValue("phone_no"),
    address: getValue("address") || null,

    posb_count: getNumber("posb_count"),
    td_count: getNumber("td_count"),
    ssa_count: getNumber("ssa_count"),
    rd_count: getNumber("rd_count"),

    pli_amount: getNumber("pli_amount"),
    rpli_amount: getNumber("rpli_amount"),
    parcel_amount: getNumber("parcel_amount"),
    document_amount: getNumber("document_amount"),
    logistics_amount: getNumber("logistics_amount"),
    aadhaar_amount: getNumber("aadhaar_amount"),
    kvic_verification: getNumber("kvic_verification"),

    expected_business: getNumber("expected_business"),
    primary_vertical: getValue("primary_vertical") || null,
    business_potential_description:
      getValue("business_potential_description") || null,
    followup_reqd: getValue("followup_reqd") || "No",
    followup_date:
      getValue("followup_reqd") === "Yes"
        ? getValue("followup_date")
        : null,

    total_revenue: Number(revenue.total.toFixed(2))
  };

  return payload;
}

/* -------------------------------------------------------
   SUPABASE SUBMISSION
------------------------------------------------------- */

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  if (!validateForm()) {
    setStatus("Please correct the highlighted fields before submitting.", "error");
    return;
  }

  submitButton.disabled = true;
  const originalButtonContent = submitButton.innerHTML;
  submitButton.textContent = "Submitting…";

  try {
    const payload = buildPayload();

    const { data, error } = await db
      .from(TABLE_NAME)
      .insert([payload])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    setStatus("Report submitted successfully to Supabase.", "success");

    // Offer a PDF of the submitted report.
    if (data && data.length > 0) {
      window.lastSubmittedReport = { ...payload, ...data[0] };
    } else {
      window.lastSubmittedReport = payload;
    }
  } catch (error) {
    console.error("Error saving marketing report:", error);

    let message = error?.message || "An unknown error occurred.";

    if (/permission denied|row-level security|42501/i.test(message)) {
      message =
        "Supabase denied the insert. Check the table INSERT grant and RLS policy.";
    } else if (/column .* does not exist|schema cache/i.test(message)) {
      message =
        "The database table columns do not match this form's field names. Check the table schema.";
    } else if (/network|fetch/i.test(message)) {
      message = "Network error. Check your internet connection and try again.";
    }

    setStatus(`Could not save the report: ${message}`, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
    refreshIcons();
  }
});

/* -------------------------------------------------------
   PDF EXPORT
------------------------------------------------------- */

function addPdfSectionTitle(doc, title, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(127, 17, 24);
  doc.text(title, 14, y);
  return y + 4;
}

function pdfRowsFromPayload(p) {
  const category = p.visited_category || "";

  return [
    ["Executive Name", p.executive_name],
    ["Designation", p.designation],
    ["Reporting Post Office", p.post_office],
    ["Nearest BO", p.nearest_bo || "—"],
    ["Visit Date", p.visit_date],
    ["Category Visited", category],
    ["BPM Accompanied", p.bpm_accompanied || "No"],
    ["Institution / Customer", p.institution_name],
    ["Mobile Number", p.phone_no],
    ["Address", p.address || "—"],
    ["POSB Accounts", p.posb_count],
    ["TD Accounts", p.td_count],
    ["SSA Accounts", p.ssa_count],
    ["RD Accounts", p.rd_count],
    ["PLI Premium (₹)", p.pli_amount],
    ["RPLI Premium (₹)", p.rpli_amount],
    ["Parcel Amount (₹)", p.parcel_amount],
    ["Document / Speed Post Amount (₹)", p.document_amount],
    ["Logistics Amount (₹)", p.logistics_amount],
    ["Aadhaar Amount (₹)", p.aadhaar_amount],
    ["KVIC Verifications", p.kvic_verification],
    ["Expected Business (₹)", p.expected_business],
    ["Primary Vertical", p.primary_vertical || "—"],
    ["Business Potential", p.business_potential_description || "—"],
    ["Follow-up Required", p.followup_reqd || "No"],
    ["Follow-up Date", p.followup_date || "—"]
  ];
}

function exportPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    setStatus("PDF library could not be loaded. Check your internet connection.", "error");
    return;
  }

  // Export the last submitted report if available; otherwise export current form.
  const p = window.lastSubmittedReport || buildPayload();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const red = [215, 25, 32];
  const darkRed = [127, 17, 24];

  doc.setFillColor(...darkRed);
  doc.rect(0, 0, 210, 31, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INDIA POST", 14, 12);

  doc.setFontSize(12);
  doc.text("Daily Marketing Report", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Dhemaji Sub Division", 14, 26);

  doc.setTextColor(50, 35, 36);
  let y = 40;

  y = addPdfSectionTitle(doc, "Executive & Visit Details", y);
  doc.autoTable({
    startY: y,
    head: [["Field", "Details"]],
    body: pdfRowsFromPayload(p).slice(0, 10),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: red, textColor: 255 },
    columnStyles: { 0: { cellWidth: 58 } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;
  y = addPdfSectionTitle(doc, "Business Procurement", y);

  const businessRows = pdfRowsFromPayload(p).slice(10, 21);
  doc.autoTable({
    startY: y,
    head: [["Business Metric", "Value"]],
    body: businessRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: red, textColor: 255 },
    columnStyles: { 0: { cellWidth: 75 } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  if (y > 240) {
    doc.addPage();
    y = 18;
  }

  y = addPdfSectionTitle(doc, "Revenue Estimate", y);

  const revenue = calculateRevenue();
  const revenueRows = [
    ["Savings accounts", revenue.accounts],
    ["PLI (4%)", revenue.pli],
    ["RPLI (12%)", revenue.rpli],
    ["Parcel bookings", revenue.parcel],
    ["Document / Speed Post", revenue.documents],
    ["Logistics (20%)", revenue.logistics],
    ["Aadhaar (82%)", revenue.aadhaar],
    ["KVIC (82%)", revenue.kvic]
  ].map(([label, amount]) => [label, formatINR(amount)]);

  // If exporting a previously submitted report, calculate its revenue
  // from the saved values instead of the current form.
  const savedRevenue = {
    accounts: (
      Number(p.posb_count || 0) +
      Number(p.td_count || 0) +
      Number(p.ssa_count || 0) +
      Number(p.rd_count || 0)
    ) * 219,
    pli: Number(p.pli_amount || 0) * 0.04,
    rpli: Number(p.rpli_amount || 0) * 0.12,
    parcel: Number(p.parcel_amount || 0),
    documents: Number(p.document_amount || 0),
    logistics: Number(p.logistics_amount || 0) * 0.20,
    aadhaar: Number(p.aadhaar_amount || 0) * 0.82,
    kvic: Number(p.kvic_verification || 0) * 3540 * 0.82
  };

  const actualRevenueRows = [
    ["Savings accounts", savedRevenue.accounts],
    ["PLI (4%)", savedRevenue.pli],
    ["RPLI (12%)", savedRevenue.rpli],
    ["Parcel bookings", savedRevenue.parcel],
    ["Document / Speed Post", savedRevenue.documents],
    ["Logistics (20%)", savedRevenue.logistics],
    ["Aadhaar (82%)", savedRevenue.aadhaar],
    ["KVIC (82%)", savedRevenue.kvic]
  ].map(([label, amount]) => [label, formatINR(amount)]);

  const savedTotal = Object.values(savedRevenue).reduce((a, b) => a + b, 0);

  doc.autoTable({
    startY: y,
    head: [["Revenue Category", "Estimated Revenue"]],
    body: [
      ...actualRevenueRows,
      ["TOTAL ESTIMATED REVENUE", formatINR(savedTotal)]
    ],
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: darkRed, textColor: 255 },
    columnStyles: { 1: { halign: "right" } },
    didParseCell: (data) => {
      if (data.row.index === actualRevenueRows.length && data.section === "body") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = darkRed;
      }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  if (y > 250) {
    doc.addPage();
    y = 18;
  }

  y = addPdfSectionTitle(doc, "Business Potential & Follow-up", y);

  doc.autoTable({
    startY: y,
    head: [["Field", "Details"]],
    body: pdfRowsFromPayload(p).slice(21),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: red, textColor: 255 },
    columnStyles: { 0: { cellWidth: 58 } },
    margin: { left: 14, right: 14 }
  });

  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(120, 100, 101);
    doc.text(
      `India Post · Dhemaji Sub Division | Page ${page} of ${pageCount}`,
      14,
      290
    );
  }

  const safeDate = (p.visit_date || new Date().toISOString().slice(0, 10))
    .replace(/[^0-9-]/g, "");
  doc.save(`Dhemaji_Marketing_Report_${safeDate}.pdf`);
}

pdfButton.addEventListener("click", () => {
  if (!validateForm()) {
    setStatus("Please correct the highlighted fields before exporting the PDF.", "error");
    return;
  }

  exportPdf();
});

/* -------------------------------------------------------
   RESET
------------------------------------------------------- */

resetButton.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Clear all fields in this report? Unsaved information will be lost."
  );

  if (!confirmed) return;

  form.reset();
  window.lastSubmittedReport = null;

  // Restore default values for numeric inputs.
  form.querySelectorAll('input[type="number"]').forEach((input) => {
    input.value = "0";
  });

  $("bpm_accompanied").value = "No";
  $("followup_reqd").value = "No";

  form.querySelectorAll("[aria-invalid]").forEach((input) => {
    clearFieldError(input);
  });

  updateCategoryField();
  updateFollowupField();
  updateRevenueDisplay();
  clearStatus();

  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* -------------------------------------------------------
   INITIALISE
------------------------------------------------------- */

(function initialise() {
  // Default visit date to today's local date.
  const now = new Date();
  const localToday = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  if (!$("visit_date").value) {
    $("visit_date").value = localToday;
  }

  $("followup_date").min = $("visit_date").value;

  $("visit_date").addEventListener("change", () => {
    $("followup_date").min = $("visit_date").value;

    if ($("followup_date").value &&
        $("followup_date").value < $("visit_date").value) {
      $("followup_date").value = "";
      if (getValue("followup_reqd") === "Yes") {
        showFieldError($("followup_date"),
          "Follow-up date cannot be before the visit date.");
      }
    }
  });

  updateCategoryField();
  updateFollowupField();
  updateRevenueDisplay();
  refreshIcons();
})();
