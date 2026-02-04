from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer, CustomUserSerializer, ComplaintSerializer
from .models import CustomUser, Complaint, ComplaintDocument, Volunteer, VerificationImage, CivicContact
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import json
from django.core.mail import send_mail
from django.conf import settings
from django.utils.timezone import now

# Import AI prediction module
from app.ai.predict import predict_department

class MyTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = MyTokenObtainPairSerializer

class SignupView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    if request.method == 'GET':
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def firebase_login(request):
    """
    Firebase login endpoint.
    Expects Firebase UID and email in the request body.
    Returns JWT tokens for authenticated requests.
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        uid = request.data.get('uid')
        email = request.data.get('email')
        
        logger.info(f"Firebase login attempt: uid={uid}, email={email}")
        
        if not uid or not email:
            return Response({'error': 'uid and email are required'}, status=400)
        
        # Try to get user by firebase_uid first, then by email
        user = CustomUser.objects.filter(firebase_uid=uid).first()
        logger.info(f"User lookup by firebase_uid: {user}")
        
        if not user:
            # Check if user exists with this email
            user = CustomUser.objects.filter(email=email).first()
            logger.info(f"User lookup by email: {user}")
            if user:
                # Update firebase_uid for existing email/password user
                user.firebase_uid = uid
                user.save()
                logger.info(f"Updated firebase_uid for user: {email}")
            else:
                # Create new user
                user = CustomUser.objects.create_user(
                    email=email,
                    firebase_uid=uid
                )
                logger.info(f"Created new user: {email}")
        
        # Generate JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': CustomUserSerializer(user).data
        }
        logger.info(f"Returning tokens for user: {email}")
        return Response(response_data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Firebase login error: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_view(request):
    """Test endpoint to verify permission decorator works"""
    return Response({'message': 'Test endpoint works - AllowAny is working'})



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def complaint_list_create(request):
    if request.method == 'GET':
        complaints = Complaint.objects.filter(user=request.user)
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        # Get description for AI prediction
        description = request.data.get('description', '')
        
        # 🤖 AI-based department prediction
        predicted_dept, confidence = predict_department(description, return_confidence=True)
        
        # Create complaint with AI-predicted department and category
        data = request.data.copy()
        data['department'] = predicted_dept
        data['category'] = predicted_dept  # Category auto-filled by AI
        
        serializer = ComplaintSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            response_data = serializer.data
            response_data['confidence'] = round(float(confidence), 3)
            return Response(response_data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_complaint_documents(request, complaint_id):
    """
    Upload documents to an existing complaint.
    Authenticated users can only upload to their own complaints.
    """
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        
        # Check if user owns this complaint
        if complaint.user != request.user:
            return Response({'error': 'You can only upload documents to your own complaints'}, status=status.HTTP_403_FORBIDDEN)
        
        files = request.FILES.getlist('files')
        if not files:
            return Response({'error': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        documents = []
        for file in files:
            doc = ComplaintDocument.objects.create(
                complaint=complaint,
                file=file,
                file_name=file.name,
                file_size=file.size
            )
            documents.append({
                'id': doc.id,
                'file_name': doc.file_name,
                'file_size': doc.file_size,
                'file': request.build_absolute_uri(doc.file.url),
                'uploaded_at': doc.uploaded_at.isoformat(),
            })
        
        # Return updated complaint with all documents
        updated_complaint = ComplaintSerializer(complaint).data
        return Response({
            'message': f'{len(documents)} file(s) uploaded successfully',
            'documents': documents,
            'complaint': updated_complaint
        }, status=status.HTTP_201_CREATED)
        
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_complaint_document(request, complaint_id, document_id):
    """
    Delete a specific document from a complaint.
    Authenticated users can only delete from their own complaints.
    """
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        
        # Check if user owns this complaint
        if complaint.user != request.user:
            return Response({'error': 'You can only delete documents from your own complaints'}, status=status.HTTP_403_FORBIDDEN)
        
        document = ComplaintDocument.objects.get(id=document_id, complaint=complaint)
        document.file.delete()  # Delete the actual file
        document.delete()
        
        # Return updated complaint with all remaining documents
        updated_complaint = ComplaintSerializer(complaint).data
        return Response({
            'message': 'Document deleted successfully',
            'complaint': updated_complaint
        }, status=status.HTTP_200_OK)
        
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)
    except ComplaintDocument.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==================== MODULE 2: MULTIPLE FILE UPLOAD API ====================

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow firebase_uid as fallback
def create_complaint_with_files(request):
    """
    Create complaint with multiple file uploads.
    Supports authenticated users (Bearer token) OR Firebase UID fallback.
    Accepts FormData with documents[] array.
    AI-based department prediction with confidence score.
    """
    try:
        # Use authenticated user if available, otherwise lookup by Firebase UID
        user = request.user
        
        if not user.is_authenticated:
            firebase_uid = request.data.get('firebase_uid')
            if not firebase_uid:
                return Response({'error': 'Firebase UID required when not authenticated'}, status=400)
            
            # Get or create user from Firebase UID
            user, created = CustomUser.objects.get_or_create(
                firebase_uid=firebase_uid,
                defaults={'email': request.data.get('email', f'{firebase_uid}@firebase.local')}
            )
        
        description = request.data.get('description', '')
        title = request.data.get('title', '')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        location = request.data.get('location', '')
        
        # 🤖 AI-based department prediction with confidence score
        department, confidence = predict_department(description, return_confidence=True)
        
        # Create complaint (category auto-filled by AI)
        complaint = Complaint.objects.create(
            user=user,
            title=title,
            description=description,
            category=department,  # Category auto-filled by AI = department
            department=department,
            latitude=latitude,
            longitude=longitude,
            location=location or f"({latitude}, {longitude})",
            is_public=True
        )
        
        # Phase 4: Reverse-geocode to populate ward/zone/area_name
        if latitude and longitude:
            try:
                from app.utils import reverse_geocode
                geo_data = reverse_geocode(float(latitude), float(longitude))
                if geo_data.get('ward'):
                    complaint.ward = geo_data['ward']
                if geo_data.get('zone'):
                    complaint.zone = geo_data['zone']
                if geo_data.get('area_name'):
                    complaint.area_name = geo_data['area_name']
                complaint.save()
            except Exception:
                pass
        
        # Handle multiple file uploads
        files = request.FILES.getlist('documents')
        file_urls = []
        for file in files:
            doc = ComplaintDocument.objects.create(
                complaint=complaint,
                file=file,
                file_name=file.name,
                file_size=file.size
            )
            file_urls.append({
                'id': str(doc.id),
                'name': doc.file_name,
                'url': doc.file.url,
                'size': doc.file_size
            })
        
        return Response({
            'id': str(complaint.id),
            'title': complaint.title,
            'department': department,
            'confidence': round(float(confidence), 3),  # 3 decimal places
            'documents': file_urls,
            'message': 'Complaint created successfully'
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating complaint: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# === Phase 4: Volunteer endpoints, verification images, and tracking ===

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def volunteer_complaints(request):
    """
    Return complaints for the volunteer's assigned ward/zone/area.
    """
    try:
        vol = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({'error': 'Volunteer profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if not vol.is_approved:
        return Response({'error': 'Volunteer not approved'}, status=status.HTTP_403_FORBIDDEN)

    complaints = Complaint.objects.filter(Q(ward=vol.ward) | Q(zone=vol.zone) | Q(area_name=vol.area)).order_by('-created_at')
    serializer = ComplaintSerializer(complaints, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_verification_image(request, complaint_id):
    try:
        vol = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({'error': 'Volunteer profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if 'image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        complaint = Complaint.objects.get(id=complaint_id)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)

    img = request.FILES['image']
    
    # Phase 4: Check for duplicate image via hash
    from app.utils import get_image_hash, check_image_blur
    img_hash = get_image_hash(img)
    
    # Check if this image already exists for this complaint
    existing_hashes = set()
    for vi in complaint.verification_images.all():
        try:
            existing_img_hash = get_image_hash(vi.image)
            existing_hashes.add(existing_img_hash)
        except Exception:
            pass
    
    if img_hash and img_hash in existing_hashes:
        return Response({'error': 'Duplicate image detected'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check for blur
    is_blurry = check_image_blur(img)
    if is_blurry:
        return Response({'error': 'Image is too blurry; please upload a clearer photo'}, status=status.HTTP_400_BAD_REQUEST)
    
    vi = VerificationImage.objects.create(complaint=complaint, image=img)
    return Response({'message': 'Image uploaded', 'id': vi.id}, status=status.HTTP_201_CREATED)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_complaint(request, complaint_id):
    """
    Volunteer approves or rejects a complaint.
    Body: {"action": "approve"|"reject", "notes": "..."}
    """
    try:
        vol = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({'error': 'Volunteer profile not found'}, status=status.HTTP_404_NOT_FOUND)

    if not vol.is_approved:
        return Response({'error': 'Volunteer not approved'}, status=status.HTTP_403_FORBIDDEN)

    try:
        complaint = Complaint.objects.get(id=complaint_id)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    notes = request.data.get('notes', '')

    if action == 'approve':
        complaint.verified_by_volunteer = True
        complaint.verification_notes = notes
        entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': 'approved', 'notes': notes}
        complaint.status_history = complaint.status_history + [entry]
        complaint.save()
        return Response({'message': 'Complaint approved'}, status=status.HTTP_200_OK)
    elif action == 'reject':
        complaint.verified_by_volunteer = False
        complaint.verification_notes = notes
        entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': 'rejected', 'notes': notes}
        complaint.status_history = complaint.status_history + [entry]
        complaint.save()
        return Response({'message': 'Complaint rejected'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def track_complaint(request):
    """
    Track by tracking_id or by phone number
    /api/track/?tracking_id=XXXX or /api/track/?phone=XXXXXXXX
    """
    tracking_id = request.query_params.get('tracking_id')
    phone = request.query_params.get('phone')

    if tracking_id:
        try:
            c = Complaint.objects.get(tracking_id=tracking_id)
            serializer = ComplaintSerializer(c)
            return Response(serializer.data)
        except Complaint.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    elif phone:
        users = CustomUser.objects.filter(phone_number=phone)
        complaints = Complaint.objects.filter(user__in=users)
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)
    else:
        return Response({'error': 'Provide tracking_id or phone'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_civic_contacts(request):
    """
    Suggest civic contacts based on department and optional ward.
    Query: /api/contacts/?department=roads&ward=ward1
    """
    department = request.query_params.get('department')
    ward = request.query_params.get('ward')
    
    contacts = CivicContact.objects.filter(verified=True)
    if department:
        contacts = contacts.filter(department__icontains=department)
    if ward:
        contacts = contacts.filter(Q(ward=ward) | Q(ward__isnull=True))
    
    from app.serializers import CivicContactSerializer
    serializer = CivicContactSerializer(contacts, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def escalate_complaint(request, complaint_id):
    """
    Volunteer escalates a verified complaint.
    """
    try:
        vol = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({'error': 'Volunteer profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not vol.is_approved:
        return Response({'error': 'Volunteer not approved'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        complaint = Complaint.objects.get(id=complaint_id)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not complaint.verified_by_volunteer:
        return Response({'error': 'Can only escalate verified complaints'}, status=status.HTTP_400_BAD_REQUEST)
    
    complaint.is_escalated = True
    entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': 'escalated'}
    complaint.status_history = complaint.status_history + [entry]
    complaint.save()
    return Response({'message': 'Complaint escalated'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_complaint_csv(request, complaint_id):
    """
    Export single complaint as CSV file.
    """
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        # User can only export their own complaints or admin
        if complaint.user != request.user and not is_admin(request.user):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)
    
    from app.utils import export_complaint_csv
    csv_content = export_complaint_csv(complaint)
    
    response = HttpResponse(csv_content, content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="complaint_{complaint.id}.csv"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_complaint_pdf(request, complaint_id):
    """
    Export single complaint as PDF file.
    """
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        # User can only export their own complaints or admin
        if complaint.user != request.user and not is_admin(request.user):
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)
    
    from app.utils import export_complaint_pdf_simple
    pdf_content = export_complaint_pdf_simple(complaint)
    
    response = HttpResponse(pdf_content, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="complaint_{complaint.id}.pdf"'
    return response


# ==================== MODULE 4: PUBLIC COMPLAINT VIEW (ANONYMOUS) ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def public_complaint_detail(request, complaint_id):
    """
    Get complaint details without revealing creator identity.
    Only available for public complaints.
    """
    try:
        complaint = Complaint.objects.get(id=complaint_id, is_public=True)
        
        documents = [{
            'id': str(doc.id),
            'name': doc.file_name,
            'url': doc.file.url,
            'size': doc.file_size
        } for doc in complaint.documents.all()]
        
        return Response({
            'id': str(complaint.id),
            'title': complaint.title,
            'description': complaint.description,
            'category': complaint.category,
            'department': complaint.department,
            'support_count': complaint.support_count,
            'status': complaint.status,
            'created_at': complaint.created_at,
            'latitude': complaint.latitude,
            'longitude': complaint.longitude,
            'location': complaint.location,
            'documents': documents
        })
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_complaints_list(request):
    """
    List all public complaints (anonymized for public view).
    Supports filtering by department, category, status.
    """
    complaints = Complaint.objects.filter(is_public=True)
    
    # Filtering
    department = request.query_params.get('department')
    category = request.query_params.get('category')
    status_filter = request.query_params.get('status')
    
    if department:
        complaints = complaints.filter(department=department)
    if category:
        complaints = complaints.filter(category=category)
    if status_filter:
        complaints = complaints.filter(status=status_filter)
    
    # Ordering
    complaints = complaints.order_by('-created_at')
    
    data = [{
        'id': str(c.id),
        'title': c.title,
        'department': c.department,
        'category': c.category,
        'support_count': c.support_count,
        'status': c.status,
        'created_at': c.created_at,
        'location': c.location
    } for c in complaints]
    
    return Response(data)


# ==================== MODULE 5: SUPPORT/VOTING SYSTEM ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def support_complaint(request, complaint_id):
    """
    Increment support count for a complaint.
    Uses IP address to prevent duplicate votes.
    """
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        complaint.support_count += 1
        complaint.save()
        
        return Response({
            'id': str(complaint.id),
            'support_count': complaint.support_count,
            'message': 'Support recorded'
        })
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== MODULE 6: ADMIN PANEL APIs ====================

def is_admin(user):
    """Check if user is admin"""
    return user.is_staff or user.is_superuser


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_complaints_list(request):
    """
    Admin endpoint: View all complaints with creator details.
    Only accessible by staff/superuser.
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    complaints = Complaint.objects.select_related('user').all().order_by('-created_at')
    
    # Filtering
    status_filter = request.query_params.get('status')
    department = request.query_params.get('department')
    if status_filter:
        complaints = complaints.filter(status=status_filter)
    if department:
        complaints = complaints.filter(department=department)
    
    data = [{
        'id': str(c.id),
        'title': c.title,
        'user': {
            'id': c.user.id,
            'email': c.user.email,
            'name': f"{c.user.first_name} {c.user.last_name}".strip()
        },
        'description': c.description,
        'category': c.category,
        'department': c.department,
        'status': c.status,
        'support_count': c.support_count,
        'location': c.location,
        'created_at': c.created_at,
        'documents_count': c.documents.count()
    } for c in complaints]
    
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_complaint_status(request, complaint_id):
    """
    Admin endpoint: Update complaint status.
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        new_status = request.data.get('status')
        
        if new_status:
            complaint.status = new_status
            entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': f'status:{new_status}'}
            complaint.status_history = complaint.status_history + [entry]
            complaint.save()

            # Send notification email to complaint owner if email exists
            try:
                if complaint.user and complaint.user.email:
                    send_mail(
                        'Complaint Status Updated',
                        f'Your complaint {complaint.tracking_id or complaint.id} is now {new_status}',
                        getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com'),
                        [complaint.user.email],
                        fail_silently=True
                    )
            except Exception:
                # don't fail the request if email sending fails
                pass
        
        return Response({
            'id': str(complaint.id),
            'status': complaint.status,
            'message': 'Status updated'
        })
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== MODULE 7: ANALYTICS APIs ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request):
    """
    Admin analytics: Department distribution, trends, etc.
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    # Department distribution
    department_stats = (
        Complaint.objects
        .values('department')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    
    # Status distribution
    status_stats = (
        Complaint.objects
        .values('status')
        .annotate(count=Count('id'))
    )
    
    # Category distribution
    category_stats = (
        Complaint.objects
        .values('category')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    
    # Time-based: Complaints last 7 days
    seven_days_ago = timezone.now() - timedelta(days=7)
    recent_complaints = Complaint.objects.filter(created_at__gte=seven_days_ago)
    
    # Top departments by support
    top_supported = (
        Complaint.objects
        .order_by('-support_count')[:10]
        .values('id', 'title', 'department', 'support_count')
    )
    
    return Response({
        'department_distribution': list(department_stats),
        'status_distribution': list(status_stats),
        'category_distribution': list(category_stats),
        'total_complaints': Complaint.objects.count(),
        'pending_complaints': Complaint.objects.filter(status='pending').count(),
        'resolved_complaints': Complaint.objects.filter(status='resolved').count(),
        'complaints_last_7_days': recent_complaints.count(),
        'top_supported_complaints': list(top_supported)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_geographic(request):
    """
    Geographic analysis: Complaints by location.
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    complaints = Complaint.objects.filter(
        latitude__isnull=False,
        longitude__isnull=False
    ).values('latitude', 'longitude', 'location', 'id', 'title', 'department')
    
    return Response(list(complaints))


# ==================== HELPER FUNCTIONS ====================

# NOTE: Department prediction is now handled by AI module
# See: app/ai/predict.py for predict_department() function
# This provides ML-based prediction with confidence scores



