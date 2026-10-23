# Daily Marketing Report - India Post (Dhemaji Sub Division)

A mobile-first web application designed for Marketing Executives, GDS, MTS, PA, and Postmen under the Dhemaji Sub Division (Assam Circle, India Post) to record daily institutional visits, account collections, insurance premiums, parcel/document business, Aadhaar collections, and KVIC verifications with real-time revenue calculations and Supabase integration.

## Features
- **Mobile-First Glassmorphism UI**: Sleek dark theme optimized for smartphones and field use.
- **Role & Office Selectors**: Designations (`GDS`, `ME`, `MTS`, `PA`, `OS(Mails)`, `Postman`) and Post Offices (`Dhemaji SO`, `Sissirborgaon SO`, `Simen Chapori SO`, `Jonai SO`, `Machkhowa SO`, `Bordoloni SO`).
- **Comprehensive Fields**: Institution categories, BPM/ABPM accompaniment toggle, contact details, account counts, premium collections, Aadhaar collections, KVIC verification counts, and future potential notes.
- **Real-Time Revenue Calculation**: Automatically computes yield based on your official formulas:
  - POSB, TD, SSA, RD: ₹219 per account.
  - RPLI Premium: 12% of collected premium.
  - PLI Premium: 4% of collected premium.
  - Parcel & Document: 100% of collected amount.
  - Logistics Post: 20% of collected amount.
  - Aadhaar: Amount minus 18% GST (Amount × 0.82).
  - KVIC Verification: ₹3,540 minus 18% GST per verification (₹2,902.80).
- **PDF Report Export**: Generates an official formatted PDF summary instantly on device.
- **Supabase Cloud Sync**: Securely syncs reports to your Supabase PostgreSQL database.

---

