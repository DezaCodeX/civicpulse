from django.urls import path
from .views import (
    SignupView, user_profile, firebase_login, test_view,
    # Complaint endpoints
    complaint_list_create, create_complaint_with_files,
    upload_complaint_documents, delete_complaint_document,
    # Public endpoints
    public_complaint_detail, public_complaints_list, support_complaint,
    # Admin endpoints
    admin_complaints_list, admin_update_complaint_status,
    # Volunteer / Tracking
    volunteer_complaints, upload_verification_image, verify_complaint, track_complaint,
    # Analytics endpoints
    analytics_dashboard, analytics_geographic,
    # Phase 4
    get_civic_contacts, escalate_complaint, export_complaint_csv, export_complaint_pdf
)

urlpatterns = [
    # Auth
    path('signup/', SignupView.as_view(), name='signup'),
    path('firebase-login/', firebase_login, name='firebase_login'),
    path('test/', test_view, name='test'),
    path('profile/', user_profile, name='user_profile'),
    
    # Complaints - Authenticated
    path('complaints/', complaint_list_create, name='complaint_list_create'),
    path('complaints/create/', create_complaint_with_files, name='create_complaint_with_files'),
    path('complaints/<str:complaint_id>/upload-documents/', upload_complaint_documents, name='upload_complaint_documents'),
    path('complaints/<str:complaint_id>/documents/<str:document_id>/', delete_complaint_document, name='delete_complaint_document'),
    
    # Public Endpoints - Anonymous
    path('public/complaints/', public_complaints_list, name='public_complaints_list'),
    path('public/complaints/<str:complaint_id>/', public_complaint_detail, name='public_complaint_detail'),
    path('complaints/<str:complaint_id>/support/', support_complaint, name='support_complaint'),
    # Volunteer Endpoints
    path('volunteer/complaints/', volunteer_complaints, name='volunteer_complaints'),
    path('volunteer/complaints/<str:complaint_id>/upload-image/', upload_verification_image, name='upload_verification_image'),
    path('volunteer/complaints/<str:complaint_id>/verify/', verify_complaint, name='verify_complaint'),
    path('volunteer/complaints/<str:complaint_id>/escalate/', escalate_complaint, name='escalate_complaint'),
    # Tracking
    path('track/', track_complaint, name='track_complaint'),
    # Contact Suggestion
    path('contacts/', get_civic_contacts, name='get_civic_contacts'),
    # Export
    path('complaints/<str:complaint_id>/export/csv/', export_complaint_csv, name='export_complaint_csv'),
    path('complaints/<str:complaint_id>/export/pdf/', export_complaint_pdf, name='export_complaint_pdf'),
    
    # Admin Endpoints
    path('admin/complaints/', admin_complaints_list, name='admin_complaints_list'),
    path('admin/complaints/<str:complaint_id>/status/', admin_update_complaint_status, name='admin_update_complaint_status'),
    
    # Analytics Endpoints
    path('admin/analytics/', analytics_dashboard, name='analytics_dashboard'),
    path('admin/analytics/geographic/', analytics_geographic, name='analytics_geographic'),
]
