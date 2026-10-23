"use strict";

/* =========================================================
   1. SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL = "https://amqlgdiiosmhntstuajl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_BLs1lpBBBOsXPSyqfRJHhQ_tY0azVsR";

const TABLE_NAME = "daily_marketing_reports";

if (!window.supabase?.createClient) {
  console.error("Supabase JS library did not load.");
}

const db = window.supabase?.createClient
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    )
  : null;


/* =========================================================
   2. DOM REFERENCES AND HELPERS
========================================================= */

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
  const raw = getValue(id);
  if (raw === "") return 0;

  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function formatINR(value) {
  const num = Number(value) || 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
  
  return `Rs. ${formatted}`;
}

function setStatus(message, type = "info") {
  statusElement.textContent = message;
  statusElement.className = `form-status ${type}`;
}

function clearStatus() {
  statusElement.textContent = "";
  statusElement.className = "form-status";
}

function refreshIcons() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}


/* =========================================================
   3. DATE PICKERS
========================================================= */

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


/* =========================================================
   4. CONDITIONAL FIELDS
========================================================= */

function clearFieldError(input) {
  if (!input) return;

  input.removeAttribute("aria-invalid");

  const errorElement = input
    .closest(".field")
    ?.querySelector(".field-error");

  if (errorElement) {
    errorElement.textContent = "";
  }
}

function showFieldError(input, message) {
  if (!input) return;

  input.setAttribute("aria-invalid", "true");

  const errorElement = input
    .closest(".field")
    ?.querySelector(".field-error");

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function updateCategoryField() {
  const isOther = getValue("visited_category") === "Others";
  const wrapper = $("categoryOtherWrap");
  const input = $("category_other");

  if (!wrapper || !input) return;

  wrapper.classList.toggle("hidden", !isOther);
  input.required = isOther;

  if (!isOther) {
    input.value = "";
    clearFieldError(input);
  }
}

function updateFollowupField() {
  const isRequired = getValue("followup_reqd") === "Yes";
  const wrapper = $("followupDateWrap");
  const input = $("followup_date");

  if (!wrapper || !input) return;

  wrapper.classList.toggle("hidden", !isRequired);
  input.required = isRequired;

  if (!isRequired) {
    input.value = "";
    clearFieldError(input);
  }
}

$("visited_category")?.addEventListener(
  "change",
  updateCategoryField
);

$("followup_reqd")?.addEventListener(
  "change",
  updateFollowupField
);


/* =========================================================
   5. FIELD VALIDATION
========================================================= */

function validateSingleField(input) {
  if (!input || input.disabled) return true;

  // Ignore fields that are currently conditional and hidden.
  if (input.closest(".hidden")) {
    clearFieldError(input);
    return true;
  }

  const value = input.value.trim();
  let error = "";

  if (input.required && value === "") {
    error = "This field is required.";
  }

  if (!error && input.id === "executive_name" && value) {
    if (!/^[\p{L}\p{M} .'-]+$/u.test(value)) {
      error =
        "Use letters, spaces, apostrophes, periods or hyphens only.";
    }
  }

  if (!error && input.id === "institution_name" && value) {
    if (value.length < 2) {
      error = "Enter a valid institution or customer name.";
    }
  }

  if (!error && input.id === "phone_no" && value) {
    if (!/^[6-9]\d{9}$/.test(value)) {
      error =
        "Enter a valid 10-digit Indian mobile number starting with 6–9.";
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

  if (!error && input.type === "date" && value) {
    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      error = "Enter a valid date.";
    }
  }

  if (!error && input.id === "followup_date" && value) {
    const visitDate = getValue("visit_date");

    if (visitDate && value < visitDate) {
      error = "Follow-up date cannot be before the visit date.";
    }
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

  let valid = true;
  let firstInvalid = null;

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    if (input.closest(".hidden")) return;

    if (!validateSingleField(input)) {
      valid = false;
      if (!firstInvalid) firstInvalid = input;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  return valid;
}

form.querySelectorAll("input, select, textarea").forEach((input) => {
  input.addEventListener("blur", () => {
    validateSingleField(input);
  });

  input.addEventListener("input", () => {
    if (input.hasAttribute("aria-invalid")) {
      validateSingleField(input);
    }

    if (input.type === "number") {
      updateRevenueDisplay();
    }
  });

  input.addEventListener("change", () => {
    validateSingleField(input);
    updateRevenueDisplay();
  });
});


/* =========================================================
   6. REVENUE CALCULATIONS
   Configured estimates retained from the original report.
========================================================= */

function calculateRevenueFrom(source) {
  const n = (key) => {
    const value = Number(source[key] ?? 0);
    return Number.isFinite(value) ? value : 0;
  };

  const accountCount =
    n("posb_count") +
    n("td_count") +
    n("ssa_count") +
    n("rd_count");

  const revenue = {
    accounts: accountCount * 219,
    pli: n("pli_amount") * 0.04,
    rpli: n("rpli_amount") * 0.12,
    parcel: n("parcel_amount"),
    documents: n("document_amount"),
    logistics: n("logistics_amount") * 0.20,
    aadhaar: n("aadhaar_amount") * 0.82,
    kvic: n("kvic_verification") * 3540 * 0.82
  };

  revenue.total = Object.values(revenue).reduce(
    (sum, amount) => sum + amount,
    0
  );

  return revenue;
}

function calculateRevenue() {
  return calculateRevenueFrom({
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
    kvic_verification: getNumber("kvic_verification")
  });
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

  const breakdown = $("revenueBreakdown");

  if (breakdown) {
    breakdown.innerHTML = rows.map(([label, amount]) => {
      const row = document.createElement("div");
      row.className = "revenue-line";

      const labelElement = document.createElement("span");
      labelElement.textContent = label;

      const amountElement = document.createElement("strong");
      amountElement.textContent = formatINR(amount);

      row.append(labelElement, amountElement);
      return row.outerHTML;
    }).join("");
  }

  if ($("totalRevenueDisplay")) {
    $("totalRevenueDisplay").textContent = formatINR(revenue.total);
  }

  return revenue;
}


/* =========================================================
   7. BUILD DATABASE PAYLOAD
========================================================= */

function buildPayload() {
  let visitedCategory = getValue("visited_category");

  if (visitedCategory === "Others") {
    const specifiedCategory = getValue("category_other");
    visitedCategory = specifiedCategory
      ? `Others: ${specifiedCategory}`
      : "Others";
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
        : null
  };

  // Retain the configured revenue estimate in the database.
  payload.total_revenue = Number(
    calculateRevenueFrom(payload).total.toFixed(2)
  );

  return payload;
}


/* =========================================================
   8. SUPABASE SUBMISSION
   IMPORTANT:
   Do not chain .select() to .insert().
   This prevents a SELECT permission requirement.
========================================================= */

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  if (!validateForm()) {
    setStatus(
      "Please correct the highlighted fields before submitting.",
      "error"
    );
    return;
  }

  if (!db) {
    setStatus(
      "Database did not load. Refresh the page and try again.",
      "error"
    );
    return;
  }

  submitButton.disabled = true;
  const originalButtonContent = submitButton.innerHTML;
  submitButton.textContent = "Submitting…";

  try {
    const payload = buildPayload();

    // Insert only. Do not request returned rows.
    const { error } = await db
      .from(TABLE_NAME)
      .insert([payload]);

    if (error) {
      console.error("database submission error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      throw error;
    }

    // Save the local copy for PDF export.
    window.lastSubmittedReport = { ...payload };

    setStatus(
      "Report submitted successfully.",
      "success"
    );

  } catch (error) {
    console.error("Could not save report:", error);

    const message = error?.message || "Unknown database error.";
    const code = error?.code || "";

    if (code === "42501" || /permission denied/i.test(message)) {
      setStatus(
        "database denied the insert.",
        "error"
      );
    } else if (/row-level security/i.test(message)) {
      setStatus(
        "The report was blocked by Row Level Security. Check the table's INSERT policy.",
        "error"
      );
    } else if (/column .* does not exist|schema cache/i.test(message)) {
      setStatus(
        "Database columns do not match the form. Check the table schema, including total_revenue.",
        "error"
      );
    } else if (/network|fetch|failed to fetch/i.test(message)) {
      setStatus(
        "Network request failed. Check your connection and Database project status.",
        "error"
      );
    } else {
      setStatus(`Could not save the report: ${message}`, "error");
    }

  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
    refreshIcons();
  }
});


/* =========================================================
   9. PDF EXPORT
========================================================= */

function pdfRowsFromPayload(p) {
  return [
    ["Executive Name", p.executive_name],
    ["Designation", p.designation],
    ["Reporting Post Office", p.post_office],
    ["Nearest Branch Post Office", p.nearest_bo || "—"],
    ["Visit Date", p.visit_date],
    ["Category Visited", p.visited_category],
    ["BPM / ABPM Accompanied", p.bpm_accompanied || "No"],
    ["Institution / Customer", p.institution_name],
    ["Mobile Number", p.phone_no],
    ["Address", p.address || "—"],
    ["POSB Accounts", p.posb_count],
    ["TD Accounts", p.td_count],
    ["SSA Accounts", p.ssa_count],
    ["RD Accounts", p.rd_count],
    ["PLI Premium (₹)", p.pli_amount],
    ["RPLI Premium (₹)", p.rpli_amount],
    ["Parcel Booking Amount (₹)", p.parcel_amount],
    ["Document / Speed Post Amount (₹)", p.document_amount],
    ["Logistics Amount (₹)", p.logistics_amount],
    ["Aadhaar Service Amount (₹)", p.aadhaar_amount],
    ["KVIC Verifications", p.kvic_verification],
    ["Expected Business (₹)", p.expected_business],
    ["Primary Business Vertical", p.primary_vertical || "—"],
    ["Business Potential", p.business_potential_description || "—"],
    ["Follow-up Required", p.followup_reqd || "No"],
    ["Follow-up Date", p.followup_date || "—"]
  ];
}

function addPdfSectionTitle(doc, title, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(127, 17, 24);
  doc.text(title, 14, y);
  return y + 4;
}

function exportPdf() {
  const jsPDF = window.jspdf?.jsPDF;
  
  // Fix for AutoTable binding when loading jsPDF via CDN
  if (jsPDF) {
    window.jsPDF = jsPDF;
  }

  if (typeof jsPDF !== "function") {
    console.error("jsPDF is unavailable. Check the script URLs in index.html.");
    setStatus(
      "PDF library could not be loaded. Check the jsPDF CDN script in index.html.",
      "error"
    );
    return;
  }

  if (typeof window.jspdf?.jsPDF?.API?.autoTable !== "function") {
    console.error("AutoTable is unavailable. Check its script URL in index.html.");
    setStatus(
      "PDF table library could not be loaded. Check the AutoTable script in index.html.",
      "error"
    );
    return;
  }

  // Export the last successfully submitted report, or current form data.
  const p = window.lastSubmittedReport || buildPayload();
  const revenue = calculateRevenueFrom(p);

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

  let y = 40;
  const rows = pdfRowsFromPayload(p);

  y = addPdfSectionTitle(doc, "Executive & Visit Details", y);

  doc.autoTable({
    startY: y,
    head: [["Field", "Details"]],
    body: rows.slice(0, 10),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: red, textColor: 255 },
    columnStyles: { 0: { cellWidth: 58 } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  y = addPdfSectionTitle(doc, "Business Procurement", y);

  doc.autoTable({
    startY: y,
    head: [["Business Metric", "Value"]],
    body: rows.slice(10, 21),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: red, textColor: 255 },
    columnStyles: { 0: { cellWidth: 75 } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  if (y > 235) {
    doc.addPage();
    y = 18;
  }

  y = addPdfSectionTitle(doc, "Estimated Revenue Breakdown", y);

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

  revenueRows.push(["TOTAL ESTIMATED REVENUE", formatINR(revenue.total)]);

  doc.autoTable({
    startY: y,
    head: [["Revenue Category", "Estimated Revenue"]],
    body: revenueRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: darkRed, textColor: 255 },
    columnStyles: { 1: { halign: "right" } },
    didParseCell(data) {
      if (
        data.section === "body" &&
        data.row.index === revenueRows.length - 1
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = darkRed;
      }
    },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  if (y > 240) {
    doc.addPage();
    y = 18;
  }

  y = addPdfSectionTitle(doc, "Business Potential & Follow-up", y);

  doc.autoTable({
    startY: y,
    head: [["Field", "Details"]],
    body: rows.slice(21),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: red, textColor: 255 },
    columnStyles: { 0: { cellWidth: 58 } },
    margin: { left: 14, right: 14 }
  });

  const pageCount = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 100, 101);

    doc.text(
      `India Post - Dhemaji Sub Division | Page ${page} of ${pageCount}`,
      14,
      290
    );
  }

  const date = (p.visit_date || new Date().toISOString().slice(0, 10))
    .replace(/[^0-9-]/g, "");

  doc.save(`Dhemaji_Marketing_Report_${date}.pdf`);
}

pdfButton?.addEventListener("click", () => {
  if (!validateForm()) {
    setStatus(
      "Please correct the highlighted fields before exporting the PDF.",
      "error"
    );
    return;
  }

  exportPdf();
});


/* =========================================================
   10. RESET FORM
========================================================= */

resetButton?.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Clear all fields? Unsaved information will be lost."
  );

  if (!confirmed) return;

  form.reset();
  window.lastSubmittedReport = null;

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


/* =========================================================
   11. INITIALISATION
========================================================= */

(function initialise() {
  const visitDateInput = $("visit_date");
  const followupDateInput = $("followup_date");

  // Use the browser's local date for the default visit date.
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  if (visitDateInput && !visitDateInput.value) {
    visitDateInput.value = today;
  }

  if (followupDateInput && visitDateInput) {
    followupDateInput.min = visitDateInput.value;
  }

  visitDateInput?.addEventListener("change", () => {
    if (!followupDateInput) return;

    followupDateInput.min = visitDateInput.value;

    if (
      followupDateInput.value &&
      followupDateInput.value < visitDateInput.value
    ) {
      followupDateInput.value = "";
      clearFieldError(followupDateInput);

      if (getValue("followup_reqd") === "Yes") {
        showFieldError(
          followupDateInput,
          "Follow-up date cannot be before the visit date."
        );
      }
    }
  });

  updateCategoryField();
  updateFollowupField();
  updateRevenueDisplay();
  refreshIcons();

  console.log("Marketing report application initialised.");
  console.log("Database client available:", Boolean(db));
  console.log("jsPDF available:", typeof window.jspdf?.jsPDF === "function");
  console.log(
    "AutoTable available:",
    typeof window.jspdf?.jsPDF?.API?.autoTable === "function"
  );
})();
