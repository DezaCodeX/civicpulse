## Email Notification System Testing Guide

### Overview
CivicPulse now sends transactional emails on complaint **creation** and **status updates** (volunteer/admin actions).

### Email Events

#### 1. Complaint Created
**When:** User submits a new complaint  
**Recipients:** Complaint creator (citizen)  
**Content:**
- Complaint Number
- Tracking ID (for public tracking)
- Title, Description, Department
- Status
- Created timestamp

#### 2. Volunteer Verification (Approve/Reject)
**When:** Volunteer approves or rejects a complaint  
**Recipients:**
- Citizen (complaint creator)
- Volunteer (who verified it)
- All supporters of the complaint

**Content:**
- Event ("Approved by Volunteer" or "Rejected by Volunteer")
- Full complaint details
- Supporter list with email addresses
- Attached documents
- Verification proof images

#### 3. Admin Status Update
**When:** Admin changes complaint status (pending → resolved, etc.)  
**Recipients:**
- Citizen
- Volunteer (if assigned)
- All supporters

**Content:**
- New status
- Admin notes/reason
- All complaint metadata

### Testing Emails

#### Option 1: Via Django Shell
```bash
python manage.py shell
```

```python
from app.models import Complaint
from app.views import _send_complaint_creation_confirmation
from django.test import RequestFactory

# Get any complaint
complaint = Complaint.objects.first()

# Create a fake request for URL building
factory = RequestFactory()
request = factory.get('/')
request.META['HTTP_HOST'] = 'localhost:8000'
request.META['wsgi.url_scheme'] = 'http'

# Send email
_send_complaint_creation_confirmation(request, complaint)
print(f"Email sent for complaint #{complaint.id}")
```

#### Option 2: Create a New Complaint
1. Go to **Submit Complaint** page (`http://localhost:3000/submit-complaint`)
2. Fill out the form with:
   - Title: "Test Water Leak"
   - Description: "Water is leaking from the main supply pipe"
   - Category: Choose any (Water, Roads, etc.)
   - Upload a document (optional)
3. Submit and check your email (dezacodex@gmail.com)

#### Option 3: Trigger Status Update
1. Go to **Admin Dashboard** → **Complaints** tab
2. Click status dropdown and change it
3. Optionally add a reason/notes
4. Save and check emails

### Email Configuration

**SMTP Settings Location:** `civic/settings.py`  
**Credentials Location:** `.env`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=dezacodex@gmail.com
EMAIL_HOST_PASSWORD=mwcovobwlyoslkqn
DEFAULT_FROM_EMAIL=dezacodex@gmail.com
```

### Gmail App Password Setup
1. Go to: https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Generate "App passwords" 
4. Select "Mail" + "Windows Computer" (or your OS)
5. Google generates a 16-character password
6. Copy into `.env` as `EMAIL_HOST_PASSWORD`

### Troubleshooting

#### No emails are being sent
1. Check `.env` has valid `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`
2. Confirm 2FA is enabled on Gmail account
3. Verify app password was generated (not regular password)
4. Check Django logs: `python manage.py runserver --verbosity 3`

#### SMTP Authentication Error
```
SMTPAuthenticationError: 535-5.7.8 Username and Password not accepted
```
- **Solution:** Use an App Password, not your Gmail password
- Generate at: https://myaccount.google.com/apppasswords

#### Connection Refused
```
SMTPServerDisconnected: Connection unexpectedly closed
```
- Verify `EMAIL_HOST` and `EMAIL_PORT` are correct
- Try: `smtp.office365.com` (587) for Outlook
- Test telnet: `telnet smtp.gmail.com 587`

#### Emails go to Spam
- Gmail app passwords send from your own email (not "noreply@")
- Check Gmail's filter rules
- Add `DEFAULT_FROM_EMAIL` to your Safe Senders list

### API Endpoints (For Testing)

#### Update Complaint Status + Email
```bash
POST /api/admin/complaints/{complaint_id}/status/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "status": "resolved",
  "reason": "Fixed by maintenance team"
}
```

**Response:**
```json
{
  "id": "38",
  "status": "resolved",
  "message": "Status updated"
}
```

(Emails are sent automatically after this call)

#### Admin Verify Complaint (triggers email to citizen + volunteer + supporters)
```bash
POST /api/admin/verification-queue/{complaint_id}/verify/
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "action": "accept",
  "reason": "Verified proof is valid and addresses are correct"
}
```

### Email Logs
Django logs all mail attempts (even silent failures). To enable verbose logging:

**civic/settings.py:**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

Then restart Django and watch console for mail debug output.

### Next Steps
1. ✅ Test complaint creation email → check inbox
2. ✅ Test volunteer approval email → should notify citizen + supporters
3. ✅ Test admin status update → should notify all stakeholders
4. ✅ Verify emails include full complaint details + verification images

