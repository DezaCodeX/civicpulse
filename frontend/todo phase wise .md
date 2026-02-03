n8n automation 
AI-based department segregation (NLP)
Public shareable complaint URL
admin panel with map , charts,
email sending for the respective department 
ai model to split the complaint based on the description 
geo location fetching 
filters in the public complaints
volunteer reg for area and their report 

Admin Capabilities

✅ Admin can see all complaints

✅ Admin can see who created the complaint

✅ Admin can update status

✅ Admin APIs exist



exports report

Category-wise Complaint Analytics though he ai model in this proijectr 

map 

Time-Based Trend Analysis

Why: Explicitly mentioned in project title

You need:

Complaints per day / week / month

Line chart showing trends



location based heatmap 
Why: Pattern detection = spatial analysis

You need:

Map view (Leaflet / Google Maps)

Heatmap overlay using lat/long

Admin-only visibility



🧭 CivicPulse – PHASED IMPLEMENTATION PLAN

🟢 PHASE 1: Core Complaint System (Foundation)

Goal: Stable base system with complaint lifecycle

✅ Features

Complaint submission form

Geo-location fetching (device-based)

Multiple document upload

Public shareable complaint URL

Anonymous public complaint view

Public filters (category, department, location)

Support / vote for complaints

🛠️ Implementation

Backend (Django)

Complaint model

ComplaintDocument model

File upload handling

Public complaint APIs

Support/vote API

Frontend (React)

Submit complaint page

Public complaint listing

Filters (category, department)

Public complaint detail page

📌 Outcome:
✔ Citizens can submit & view complaints
✔ Public participation enabled
✔ Identity hidden publicly

🟢 PHASE 2: Authentication & Roles

Goal: Secure system with clear user roles

✅ Features

Firebase Authentication (Email OTP / Magic Link)

Citizen login

Admin login

Volunteer registration (area-wise)

🛠️ Implementation

Backend

Firebase token verification

User creation & role mapping

Volunteer model (area, ward, department)

Frontend

Login / Verify pages

Role-based routing

Volunteer registration form

📌 Outcome:
✔ Secure access
✔ Role-based permissions
✔ Volunteers mapped to areas

🟢 PHASE 3: AI-Based Department Segregation (NLP)

Goal: Automatic complaint routing using AI

✅ Features

AI model to classify complaint description

Category & department prediction

Used during complaint creation

🛠️ Implementation

NLP preprocessing (TF-IDF)

ML model (Logistic Regression / Naive Bayes)

predict_department(text) function

Auto-assign department on submit

📌 Outcome:
✔ No manual routing
✔ Faster resolution
✔ Strong AI component for viva

🟢 PHASE 4: n8n Automation & Email Notifications

Goal: Workflow automation & real-time alerts

✅ Features

n8n webhook integration

Email to respective department

Status change alerts

Escalation workflows (SLA-based)

Weekly summary reports

🛠️ Implementation

Django

Trigger n8n webhooks after events

Secure webhook calls

n8n

Department-wise email routing

Escalation logic

Report generation

📌 Outcome:
✔ Automated governance workflows
✔ Real-world system feel
✔ High project value

🟢 PHASE 5: Admin Panel (Control Center)

Goal: Full visibility & control for authorities

✅ Features

Admin dashboard

Admin sees all complaints

Admin sees who created complaint

Admin updates status

Volunteer reports view

🛠️ Implementation

Backend

Admin-only APIs

Filters by department, status, date

Frontend

Admin dashboard page

Complaint table

Status update controls

📌 Outcome:
✔ Authority-centric system
✔ Clear admin justification

🟢 PHASE 6: Analytics & Pattern Detection (CORE PROJECT-3)

Goal: Data-driven insights

🔵 6.1 Category-wise Complaint Analytics (AI-assisted)

Why: Explicit Project-3 requirement

Features

Category-wise counts

AI-based category classification

Charts (bar / pie)

Implementation

Aggregation APIs

Chart.js / Plotly visualizations

📌 Outcome:
✔ Identifies frequent issues

🔵 6.2 Time-Based Trend Analysis

Why: Mentioned in project title

Features

Complaints per:

Day

Week

Month

Line chart trends

Implementation

Time-series aggregation API

Line charts

📌 Outcome:
✔ Detects rising / declining issues

🔵 6.3 Location-Based Heatmap (Spatial Analytics)

Why: Pattern detection = spatial intelligence

Features

Map view (Leaflet / Google Maps)

Heatmap overlay

Admin-only visibility

Implementation

Fetch lat/long data

Heatmap rendering

📌 Outcome:
✔ Identifies problem-dense areas

🟢 PHASE 7: Reports & Exporting

Goal: Decision-support for authorities

✅ Features

Export analytics:

CSV

Excel

Department-wise reports

Time-based reports

🛠️ Implementation

Pandas-based exports

Download APIs

📌 Outcome:
✔ Strong analytics justification
✔ Administrative usefulness

🟢 PHASE 8: Final Enhancements (Optional / Distinction)

Goal: Extra marks & differentiation

🌟 Optional Features

Sentiment analysis (positive/negative)

Priority prediction (urgent vs normal)

Public analytics (anonymous)

Power BI integration

📌 Outcome:
✔ Research depth
✔ Higher academic score




remarks 
phase 1 and 2 completed 
phase 3 is on going 