-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- KSA APPLICANTS TABLE
create table if not exists applicants (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- 1. PERSONAL DETAILS
  full_name text not null,
  phone_number text not null,
  national_id text,
  dob date not null,
  calculated_age int not null,
  email text not null,
  county_of_residence text,

  -- 2. TRACKING & LOGIC
  course_track text check (course_track in ('CBET', 'DIPLOMA')),
  
  -- 3. ACADEMIC DETAILS
  highest_qualification text, -- For CBET (Degree/Diploma/Cert/KCSE)
  kcse_mean_grade text,       -- For Diploma Track (A to E)
  
  -- 4. PREFERENCES
  preferred_campus text, -- Nyeri, Thika, Ugenya, Ainabkoi
  
  -- 5. PAYMENT
  mpesa_code text not null check (char_length(mpesa_code) = 10),
  
  -- 6. SYSTEM STATUS
  status text default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  email_sent boolean default false
);

-- Turn off RLS for simplicity in this demo (or enable with policy if preferred)
alter table applicants enable row level security;

-- Allow public access for this demo app (since we use anon key for inserts)
create policy "Enable insert for all users" on applicants for insert with check (true);
create policy "Enable read for all users" on applicants for select using (true);
