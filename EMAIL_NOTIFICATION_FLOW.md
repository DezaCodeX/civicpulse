## CivicPulse Email Notification Flow - Complete Reference

### Overview
EVERY action on a complaint triggers comprehensive email notifications to ALL stakeholders.

**Recipients in each email:**
| Recipient | When Included |
|-----------|--------------|
| **Citizen** (complaint creator) | ALWAYS - Every single email |
| **Volunteer** (who verified) | If volunteer is assigned to the complaint |
| **Supporters** | All users who have supported the complaint |

---

## 1. COMPLAINT CREATION
**Trigger:** User submits new complaint  
**Recipients:** CITIZEN only  
**Subject:** `CivicPulse: Complaint Registered #{ID} - Tracking: {TRACKING_ID}`

**Email includes:**
- Full complaint details (title, description, department, priority, sentiment)
- Complaint number & tracking ID
- Location info (ward, zone, coordinates)
- Created timestamp
- Status
- Next steps for citizen

**Example scenario:**
- User "raj@example.com" submits complaint about water leak
- ✉️ Email sent to: raj@example.com
- ✉️ Subject: "CivicPulse: Complaint Registered #38 - Tracking: ABC123DEF456"

---

## 2. VERIFICATION IMAGE UPLOADED
**Trigger:** Volunteer uploads proof/verification image  
**Recipients:** Citizen + All Supporters  
**Subject:** `CivicPulse Update: Verification Proof Image Uploaded - Complaint #{ID}`

**Email includes:**
- All complaint details
- ALL verification images (with URLs to view)
- ALL attached documents
- All supporters list with email addresses
- Supporter count
- Volunteer who uploaded the image
- Any validation warnings

**Example scenario:**
- Volunteer "volunteer@ngo.com" uploads verification photo
- ✉️ Email sent to:
  - raj@example.com (citizen)
  - user1@gmail.com (supporter 1)
  - user2@gmail.com (supporter 2)
  - etc.
- ✉️ Subject: "CivicPulse Update: Verification Proof Image Uploaded - Complaint #38"

---

## 3. VOLUNTEER APPROVES COMPLAINT
**Trigger:** Volunteer clicks "Approve" on complaint  
**Recipients:** Citizen + Volunteer + All Supporters  
**Subject:** `CivicPulse Update: Approved by Volunteer - Complaint #{ID}`

**Email includes:**
- Full complaint summary
- Volunteer's verification notes
- ALL verification images with proof URLs
- ALL attached documents with download links
- Complete supporter list
- Reminder that complaint is now public and open for more support
- City/Ward/Zone information

**Example scenario:**
- Volunteer "volunteer@ngo.com" approves complaint
- ✉️ Email sent to:
  - raj@example.com (citizen) - SEE: Your complaint was approved!
  - volunteer@ngo.com (volunteer) - SEE: You approved this complaint
  - user1@gmail.com (supporter 1) - SEE: Complaint you supported was approved!
  - user2@gmail.com (supporter 2) - SEE: Complaint you supported was approved!
- ✉️ Subject: "CivicPulse Update: Approved by Volunteer - Complaint #38"

---

## 4. VOLUNTEER REJECTS COMPLAINT
**Trigger:** Volunteer clicks "Reject" on complaint  
**Recipients:** Citizen + Volunteer + All Supporters  
**Subject:** `CivicPulse Update: Rejected by Volunteer - Complaint #{ID}`

**Email includes:**
- Full complaint details
- **REJECTION REASON** (provided by volunteer)
- ALL verification images (for reference)
- Volunteer's contact info
- Instructions for resubmission if applicable

**Example scenario:**
- Volunteer "volunteer@ngo.com" rejects with reason: "Location details are unclear"
- ✉️ Email sent to:
  - raj@example.com (citizen) - SEE: Your complaint needs more details
  - volunteer@ngo.com (volunteer) - SEE: You rejected this complaint
  - user1@gmail.com (supporter 1) - SEE: Complaint was rejected
- ✉️ Subject: "CivicPulse Update: Rejected by Volunteer - Complaint #38"
- ✉️ Reason included: "Location details are unclear"

---

## 5. ADMIN VERIFIES COMPLAINT (Accept)
**Trigger:** Admin clicks "Accept" in Verification Queue  
**Recipients:** Citizen + Volunteer + All Supporters  
**Subject:** `CivicPulse Update: Approved by Admin - Complaint #{ID}`

**Email includes:**
- Full complaint details
- **ADMIN'S VERIFICATION REASON**
- ALL documents attached
- ALL verification images (proof)
- ALL supporters with names & emails
- Complaint is now **PUBLIC** and visible to all
- Next steps (more support, resolution tracking)

**Example scenario:**
- Admin "admin@civicpulse.com" approves with reason: "All proof verified and location confirmed"
- ✉️ Email sent to:
  - raj@example.com (citizen)
  - volunteer@ngo.com (volunteer)
  - user1@gmail.com (supporter)
  - user2@gmail.com (supporter)
- ✉️ Subject: "CivicPulse Update: Approved by Admin - Complaint #38"

---

## 6. ADMIN REJECTS COMPLAINT (Reject)
**Trigger:** Admin clicks "Reject" in Verification Queue  
**Recipients:** Citizen + Volunteer + All Supporters  
**Subject:** `CivicPulse Update: Rejected - Complaint #{ID}`

**Email includes:**
- Full complaint details
- **ADMIN'S REJECTION REASON** (in detail)
- ALL verification images provided
- Volunteer's contact for appeal/clarification
- instructions on how to resubmit or appeal

**Example scenario:**
- Admin rejects with reason: "Complaint falls outside civic jurisdiction. This is a private property issue."
- ✉️ Email sent to:
  - raj@example.com (citizen)
  - volunteer@ngo.com (volunteer)
  - user1@gmail.com (supporter)
- ✉️ Subject: "CivicPulse Update: Rejected - Complaint #38"

---

## 7. ADMIN UPDATES COMPLAINT STATUS
**Trigger:** Admin changes status (pending → in_progress → resolved, etc.)  
**Recipients:** Citizen + Volunteer + All Supporters  
**Subject:** `CivicPulse Update: Status Updated - Complaint #{ID}`

**Email includes:**
- Full complaint details
- **NEW STATUS** (highlighted)
- **STATUS CHANGE REASON** (if provided by admin)
- ALL documents & images
- Complete stakeholder list
- Current verification status

**Example scenarios:**

**Status: Pending → In Progress**
- ✉️ Email sent to all stakeholders
- ✉️ Content: "The roads department has started repairs on this pothole"

**Status: In Progress → Resolved**
- ✉️ Email sent to all stakeholders  
- ✉️ Content: "The water leak has been fixed and pipe replaced"

**Status: Any → Rejected**
- ✉️ Email sent to all stakeholders
- ✉️ Content: "This complaint was rejected due to [admin reason]"

---

## Email Content Structure (ALL Emails)

Every email follows this format:

```
*** HEADER (Changes per event type) ***

EVENT TYPE:
- Complaint Created
- Verification Image Uploaded
- Approved by Volunteer
- Rejected by Volunteer
- Approved by Admin
- Status Updated
- etc.

Update Details:
- Updated At: [timestamp]
- Updated By: [actor email]
- Reason/Notes: [if applicable]

---

COMPLAINT SUMMARY (ALWAYS INCLUDED):
- Complaint Number
- Tracking ID
- Title & Description
- Department & Category
- Status & Priority
- Location (latitude, longitude, ward, zone, area)
- Created Date

---

CITIZEN INFO:
- Full Name
- Email
- Phone

---

VOLUNTEER INFO (if assigned):
- Name & Email
- Verification Status
- Verification Notes

---

SUPPORTERS LIST:
- Count of supporters
- Name & Email of each supporter
- Date they supported

---

ATTACHED DOCUMENTS:
- Filename
- File size
- Upload date
- Download link

---

VERIFICATION PROOF IMAGES:
- Upload timestamp
- Uploaded by volunteer name
- View links to all images

---

VERIFICATION STATUS:
- Volunteer Verified: Yes/No
- Admin Verified: Yes/No
- Flagged for Review: Yes/No

---

FOOTER:
Thank you message & CivicPulse Team signature
```

---

## Testing Email Notifications

### Test Scenario 1: Full Workflow
1. User submits complaint → ✉️ Creates confirmation email
2. Volunteer uploads image → ✉️ Notifies citizen + supporters
3. Volunteer approves → ✉️ Notifies citizen + volunteer + supporters
4. Admin verifies → ✉️ Notifies all stakeholders
5. Status changed to resolved → ✉️ Final notification to all

### Test Scenario 2: Rejection Path
1. User submits complaint → ✉️ Confirmation
2. Volunteer uploads image → ✉️ Notification
3. Volunteer rejects with reason → ✉️ Rejection + reason to all
4. Email includes why it was rejected

### Quick Test Commands

**Send test email via Django shell:**
```bash
python manage.py shell
```

```python
from app.models import Complaint
from app.views import _send_complaint_creation_confirmation
from django.test import RequestFactory

complaint = Complaint.objects.first()
factory = RequestFactory()
request = factory.get('/')
request.META['HTTP_HOST'] = 'localhost:8000'

_send_complaint_creation_confirmation(request, complaint)
print(f"Test email sent for complaint #{complaint.id}")
```

**Check Gmail for emails:**
- Go to: https://mail.google.com
- Filter by: from:dezacodex@gmail.com
- Should see emails labeled "CivicPulse: ..."

---

## Email Configuration

**SMTP Server:** Gmail (smtp.gmail.com:587)  
**From Email:** dezacodex@gmail.com  
**Configuration File:** `.env`

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=dezacodex@gmail.com
EMAIL_HOST_PASSWORD=mwcovobwlyoslkqn
DEFAULT_FROM_EMAIL=dezacodex@gmail.com
```

---

## Summary Table

| Event | Citizen | Volunteer | Supporters | Reason |
|-------|----------|-----------|-----------|--------|
| Complaint Created | ✅ | ❌ | ❌ | Acknowledgment to creator |
| Image Uploaded | ✅ | ❌ | ✅ | Proof added, notify supporters |
| Volunteer Approved | ✅ | ✅ | ✅ | All stakeholders need to know |
| Volunteer Rejected | ✅ | ✅ | ✅ | All stakeholders + reason |
| Admin Verified | ✅ | ✅ | ✅ | Public now, all informed |
| Admin Rejected | ✅ | ✅ | ✅ | Rejects with reason to all |
| Status Updated | ✅ | ✅ | ✅ | Progress updates to all |
| Document Added | ✅ | ✅ | ✅ | If via verification |

---

## Email Delivery Guarantees

**`fail_silently=True`** means:
- If email fails to send, NO ERROR is thrown to user
- User still gets success response (complaint created, status updated, etc.)
- Email failure is logged in Django logs (check server console)
- User can use Tracking ID to retrieve complaint status later

**To enable strict email errors (for testing):**
Edit `app/views.py` and change `fail_silently=True` → `fail_silently=False`
Then Django will throw errors if SMTP fails (useful for debugging).

