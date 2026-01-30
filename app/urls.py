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
    # Analytics endpoints
    analytics_dashboard, analytics_geographic
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
    
    # Admin Endpoints
    path('admin/complaints/', admin_complaints_list, name='admin_complaints_list'),
    path('admin/complaints/<str:complaint_id>/status/', admin_update_complaint_status, name='admin_update_complaint_status'),
    
    # Analytics Endpoints
    path('admin/analytics/', analytics_dashboard, name='analytics_dashboard'),
    path('admin/analytics/geographic/', analytics_geographic, name='analytics_geographic'),
]
