# Daily Marketing Report - India Post (Dhemaji Sub Division)

A mobile-first web application designed for Marketing Executives, GDS, MTS, PA, and Postmen under the Dhemaji Sub Division (Assam Circle, India Post) to record daily institutional visits, account collections, insurance premiums, parcel/document business, Aadhaar collections, and KVIC verifications with real-time revenue calculations and Supabase integration.

## Features
- **Mobile-First Glassmorphism UI**: Sleek dark theme optimized for smartphones and field use.
- **Role & Office Selectors**: Designations (`GDS`, `ME`, `MTS`, `PA`, `OS(Mails)`, `Postman`) and Post Offices (`Dhemaji SO`, `Sissirborgaon SO`, `Simen Mukh SO`, `Jonai SO`, `Machkhowa SO`, `Bordoloni SO`).
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

## Supabase Database Setup

Run the following SQL query in your Supabase SQL Editor to create the required table:

```sql
create table daily_marketing_reports (
    id uuid default gen_random_uuid() primary key,
    executive_name text not null,
    designation text not null,
    post_office text not null,
    nearest_bo text not null,
    visit_date date not null,
    visited_category text not null,
    bpm_accompanied text not null,
    institution_name text not null,
    phone_no text not null,
    address text not null,
    posb_count integer default 0,
    td_count integer default 0,
    ssa_count integer default 0,
    rd_count integer default 0,
    pli_amount numeric(12,2) default 0,
    rpli_amount numeric(12,2) default 0,
    parcel_amount numeric(12,2) default 0,
    document_amount numeric(12,2) default 0,
    logistics_amount numeric(12,2) default 0,
    aadhaar_amount numeric(12,2) default 0,
    kvic_verification integer default 0,
    expected_business numeric(12,2) default 0,
    primary_vertical text not null,
    business_potential_description text,
    followup_reqd text not null,
    followup_date date,
    total_revenue numeric(12,2) default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
