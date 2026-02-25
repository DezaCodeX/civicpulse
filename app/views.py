from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer, CustomUserSerializer, ComplaintSerializer
from .models import CustomUser, Complaint, ComplaintDocument, Volunteer, VerificationImage, CivicContact, ComplaintSupport
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import json
from django.core.mail import send_mail
from django.conf import settings
from django.utils.timezone import now
from app.utils import get_sentiment, predict_priority
import logging

logger = logging.getLogger(__name__)

# Import AI prediction module
from app.ai.predict import predict_department

class MyTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = MyTokenObtainPairSerializer

class SignupView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    if request.method == 'GET':
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)
    elif request.method in ['PUT', 'PATCH']:
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

@api_view(['POST'])
@permission_classes([AllowAny])
def supabase_login(request):
    """
    Supabase login endpoint.
    Syncs Supabase OAuth authentication with Django user system.
    
    Expected request data:
    {
        "email": "user@example.com",
        "supabase_token": "...",  # Supabase access token
        "user_metadata": {...}     # Optional metadata from Supabase
    }
    
    Returns JWT tokens and user data for Django authentication.
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        email = request.data.get('email')
        supabase_token = request.data.get('supabase_token')
        user_metadata = request.data.get('user_metadata', {})
        
        logger.info(f"Supabase login attempt: email={email}")
        
        if not email or not supabase_token:
            return Response(
                {'error': 'email and supabase_token are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to get existing user by email
        user = CustomUser.objects.filter(email=email).first()
        logger.info(f"User lookup by email: {user}")
        
        if not user:
            # Create new user from Supabase
            # Extract name from metadata if available
            first_name = user_metadata.get('first_name') or user_metadata.get('given_name', '')
            last_name = user_metadata.get('last_name') or user_metadata.get('family_name', '')
            
            # If no name in metadata, try to parse from user_metadata.name
            if not first_name and not last_name:
                full_name = user_metadata.get('name') or user_metadata.get('full_name', '')
                if full_name:
                    name_parts = full_name.split(' ', 1)
                    first_name = name_parts[0]
                    last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            user = CustomUser.objects.create_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
            )
            logger.info(f"Created new user from Supabase: {email}")
        
        # Generate JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': CustomUserSerializer(user).data
        }
        logger.info(f"Returning tokens for user: {email}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Supabase login error: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Authentication failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

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

        sentiment = get_sentiment(description)
        priority = predict_priority(description)
        
        # Create complaint with AI-predicted department and category
        data = request.data.copy()
        data['department'] = predicted_dept
        data['category'] = predicted_dept  # Category auto-filled by AI
        data['sentiment'] = sentiment
        data['priority'] = priority
        
        serializer = ComplaintSerializer(data=data)
        if serializer.is_valid():
            complaint = serializer.save(user=request.user)
            _send_complaint_creation_confirmation(request, complaint)
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

        sentiment = get_sentiment(description)
        priority = predict_priority(description)
        
        # Create complaint (category auto-filled by AI)
        complaint = Complaint.objects.create(
            user=user,
            title=title,
            description=description,
            category=department,  # Category auto-filled by AI = department
            department=department,
            sentiment=sentiment,
            priority=priority,
            latitude=latitude,
            longitude=longitude,
            location=location or f"({latitude}, {longitude})",
            is_public=True
        )
        _send_complaint_creation_confirmation(request, complaint)
        
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
        
        # Handle multiple file uploads (support common form keys)
        files = (
            request.FILES.getlist('documents')
            or request.FILES.getlist('documents[]')
            or request.FILES.getlist('files')
        )
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
    
    # Comprehensive file validation
    from app.utils import validate_verification_image
    validation = validate_verification_image(img, complaint)
    
    if not validation['is_valid']:
        return Response({
            'error': 'Image validation failed',
            'errors': validation['errors'],
            'warnings': validation['warnings']
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create verification image
    vi = VerificationImage.objects.create(complaint=complaint, image=img, volunteer=request.user)
    
    # Flag for admin review if validation warnings exist
    if validation['should_flag_for_review']:
        complaint.flag_for_admin_review = True
        complaint.admin_review_reason = 'Image validation warning: ' + ', '.join(validation['warnings'])
        complaint.save()
    
    # Send notification email about verification image upload
    _send_complaint_status_notification(
        request,
        complaint,
        event_title='Verification Proof Image Uploaded',
        actor_email=request.user.email,
        reason=f"Volunteer {request.user.first_name} {request.user.last_name} has uploaded verification proof image(s).",
    )
    
    response_data = {
        'message': 'Image uploaded successfully',
        'id': str(vi.id),
        'warnings': validation['warnings'] if validation['warnings'] else []
    }
    
    return Response(response_data, status=status.HTTP_201_CREATED)


def _complaint_notification_recipients(complaint):
    recipients = set()
    if complaint.user and complaint.user.email:
        recipients.add(complaint.user.email)
    if complaint.verified_by_volunteer_user and complaint.verified_by_volunteer_user.email:
        recipients.add(complaint.verified_by_volunteer_user.email)
    for support in complaint.supports.select_related('user').all():
        if support.user and support.user.email:
            recipients.add(support.user.email)
    return list(recipients)


def _verification_image_urls(request, complaint):
    return [
        request.build_absolute_uri(vi.image.url)
        for vi in complaint.verification_images.all()
    ]


def _format_complaint_details(complaint, request=None):
    """
    Format comprehensive complaint details for inclusion in emails.
    """
    details = (
        f"COMPLAINT SUMMARY:\n"
        f"==================\n"
        f"Complaint Number: {complaint.id}\n"
        f"Tracking ID: {complaint.tracking_id}\n"
        f"Title: {complaint.title}\n"
        f"Description: {complaint.description}\n"
        f"Department: {complaint.department}\n"
        f"Category: {complaint.category}\n"
        f"Status: {complaint.status}\n"
        f"Priority: {complaint.priority}\n"
        f"Sentiment: {complaint.sentiment}\n"
        f"Created: {complaint.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Location: {complaint.location or 'N/A'}\n"
        f"Ward/Zone/Area: {complaint.ward or 'N/A'} / {complaint.zone or 'N/A'} / {complaint.area_name or 'N/A'}\n\n"
    )
    
    # Citizen info
    if complaint.user:
        details += (
            f"CITIZEN (Complaint Creator):\n"
            f"===========================\n"
            f"Name: {complaint.user.first_name} {complaint.user.last_name}\n"
            f"Email: {complaint.user.email}\n"
            f"Phone: {complaint.user.phone_number or 'N/A'}\n\n"
        )
    
    # Volunteer info
    if complaint.verified_by_volunteer_user:
        details += (
            f"VOLUNTEER (Verifying Party):\n"
            f"============================\n"
            f"Name: {complaint.verified_by_volunteer_user.first_name} {complaint.verified_by_volunteer_user.last_name}\n"
            f"Email: {complaint.verified_by_volunteer_user.email}\n"
            f"Verified: {'Yes' if complaint.verified_by_volunteer else 'No'}\n"
            f"Verification Notes: {complaint.verification_notes or 'None'}\n\n"
        )
    
    # Supporters
    supporter_count = complaint.supports.count() if complaint.supports.exists() else complaint.support_count
    details += (
        f"SUPPORTERS ({supporter_count}):\n"
        f"================\n"
    )
    if supporter_count > 0:
        for support in complaint.supports.select_related('user').all():
            details += f"- {support.user.first_name} {support.user.last_name} ({support.user.email}) - Supported: {support.supported_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
    else:
        details += "No supporters yet\n"
    details += "\n"
    
    # Documents
    docs = complaint.documents.all()
    details += (
        f"ATTACHED DOCUMENTS ({docs.count()}):\n"
        f"============================\n"
    )
    if docs.count() > 0:
        for doc in docs:
            details += f"- {doc.file_name} ({doc.file_size} bytes) - Uploaded: {doc.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
            if request:
                details += f"  URL: {request.build_absolute_uri(doc.file.url)}\n"
    else:
        details += "No documents attached\n"
    details += "\n"
    
    # Verification Images
    images = complaint.verification_images.all()
    details += (
        f"VERIFICATION PROOF IMAGES ({images.count()}):\n"
        f"==================================\n"
    )
    if images.count() > 0:
        for img in images:
            details += f"- Uploaded: {img.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
            if img.volunteer:
                details += f"  Uploaded by: {img.volunteer.first_name} {img.volunteer.last_name}\n"
            if request:
                details += f"  URL: {request.build_absolute_uri(img.image.url)}\n"
    else:
        details += "No verification images\n"
    details += "\n"
    
    return details


def _send_complaint_creation_confirmation(request, complaint):
    """
    Send confirmation email when a complaint is created.
    Notifies the CITIZEN with their complaint number and tracking ID.
    """
    if not complaint.user or not complaint.user.email:
        return
    
    message = (
        f"Dear {complaint.user.first_name or 'User'},\n\n"
        f"*** You are receiving this email because YOU CREATED THIS COMPLAINT ***\n\n"
        f"Your complaint has been successfully registered in CivicPulse.\n\n"
        f"Save your TRACKING ID for future reference: {complaint.tracking_id}\n\n"
    )
    message += _format_complaint_details(complaint, request)
    message += (
        f"NEXT STEPS:\n"
        f"===========\n"
        f"1. A volunteer will verify your complaint details\n"
        f"2. Once verified, your complaint will be public and open for support\n"
        f"3. Other citizens can support your complaint\n"
        f"4. You will receive email updates on every status change\n\n"
        f"Thank you for using CivicPulse.\n"
        f"Best regards,\nCivicPulse Team"
    )
    
    try:
        send_mail(
            subject=f"CivicPulse: Complaint Registered #{complaint.id} - Tracking: {complaint.tracking_id}",
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com'),
            recipient_list=[complaint.user.email],
            fail_silently=True,
        )
    except Exception:
        logger.error("Failed sending complaint creation confirmation", exc_info=True)


def _send_complaint_status_notification(request, complaint, event_title, actor_email, reason='', extra_recipients=None):
    """
    Send comprehensive status update email to ALL stakeholders:
    - Citizen (complaint creator)
    - Volunteer (who verified)
    - All supporters
    
    Includes all complaint details, documents, images, and subscriber information.
    """
    recipients = _complaint_notification_recipients(complaint)
    if extra_recipients:
        recipients.extend(extra_recipients)
        recipients = list(set(filter(None, recipients)))
    if not recipients:
        return

    message = (
        f"*** COMPLAINT STATUS UPDATE ***\n\n"
        f"This is a notification to ALL parties involved with this complaint.\n"
        f"Recipients: Complaint Creator, Volunteer Verifier, and all Supporters\n\n"
        f"EVENT: {event_title}\n"
        f"Updated By: {actor_email}\n"
        f"Updated At: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    )
    
    if reason:
        message += f"REASON/NOTES:\n{reason}\n\n"
    
    message += _format_complaint_details(complaint, request)
    
    message += (
        f"VERIFICATION STATUS:\n"
        f"================\n"
        f"Volunteer Verified: {'Yes' if complaint.verified_by_volunteer else 'No'}\n"
        f"Admin Verified: {'Yes' if complaint.admin_verified else 'No'}\n"
        f"Flagged for Review: {'Yes' if complaint.flag_for_admin_review else 'No'}\n\n"
        f"Thank you for being part of CivicPulse.\n"
        f"Best regards,\nCivicPulse Team"
    )

    try:
        send_mail(
            subject=f"CivicPulse Update: {event_title} - Complaint #{complaint.id}",
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com'),
            recipient_list=recipients,
            fail_silently=True,
        )
    except Exception:
        logger.error("Failed sending complaint status notification", exc_info=True)



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
        complaint.verified_by_volunteer_user = request.user
        complaint.volunteer_verification_timestamp = now()
        complaint.status = 'in_progress'
        complaint.verification_notes = notes
        entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': 'approved', 'notes': notes}
        complaint.status_history = complaint.status_history + [entry]
        complaint.save()
        _send_complaint_status_notification(
            request,
            complaint,
            event_title='Approved by Volunteer',
            actor_email=request.user.email,
            reason=notes,
        )
        return Response({'message': 'Complaint approved by volunteer'}, status=status.HTTP_200_OK)
    elif action == 'reject':
        complaint.verified_by_volunteer = False
        complaint.verified_by_volunteer_user = request.user
        complaint.volunteer_verification_timestamp = now()
        complaint.status = 'rejected'
        complaint.verification_notes = notes
        entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': 'rejected', 'notes': notes}
        complaint.status_history = complaint.status_history + [entry]
        complaint.save()
        _send_complaint_status_notification(
            request,
            complaint,
            event_title='Rejected by Volunteer',
            actor_email=request.user.email,
            reason=notes,
        )
        return Response({'message': 'Complaint rejected by volunteer'}, status=status.HTTP_200_OK)
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


# ==================== VOLUNTEER DASHBOARD & FILTERING ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def volunteer_dashboard_filters(request):
    """
    Get filtered complaints for volunteer dashboard.
    Query params: ward, zone, area, status, category
    /api/volunteer/dashboard/?ward=X&zone=Y&status=pending
    """
    try:
        vol = Volunteer.objects.get(user=request.user)
    except Volunteer.DoesNotExist:
        return Response({'error': 'Volunteer profile not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not vol.is_approved:
        return Response({'error': 'Volunteer not approved'}, status=status.HTTP_403_FORBIDDEN)
    
    # Base query: all complaints (volunteer can narrow down using filters)
    complaints = Complaint.objects.all()
    
    # Apply optional filters
    ward = request.query_params.get('ward')
    zone = request.query_params.get('zone')
    area = request.query_params.get('area')
    status_filter = request.query_params.get('status')
    category = request.query_params.get('category')
    
    if ward:
        complaints = complaints.filter(ward=ward)
    if zone:
        complaints = complaints.filter(zone=zone)
    if area:
        complaints = complaints.filter(area_name=area)
    if status_filter:
        complaints = complaints.filter(status=status_filter)
    if category:
        complaints = complaints.filter(category=category)
    
    serializer = ComplaintSerializer(complaints.order_by('-created_at'), many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def volunteer_check_approval(request):
    """
    Check if user is an approved volunteer.
    Returns volunteer profile if approved, else error.
    """
    try:
        vol = Volunteer.objects.get(user=request.user)
        if not vol.is_approved:
            return Response({'error': 'Volunteer not approved'}, status=status.HTTP_403_FORBIDDEN)
        
        from app.serializers import VolunteerSerializer
        serializer = VolunteerSerializer(vol)
        return Response({
            'is_approved': True,
            'volunteer': serializer.data
        })
    except Volunteer.DoesNotExist:
        return Response({'error': 'Volunteer profile not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== ADMIN VERIFICATION OF VOLUNTEER PROOF ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_verification_queue(request):
    """
    Admin endpoint: Get complaints awaiting admin verification.
    Only shows complaints that were approved by volunteer but not yet verified by admin.
    /api/admin/verification-queue/
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    # Get complaints that are volunteer-verified but not admin-verified
    complaints = Complaint.objects.filter(
        verified_by_volunteer=True,
        admin_verified=False
    ).select_related('user', 'verified_by_volunteer_user').order_by('-volunteer_verification_timestamp')
    
    data = []
    for c in complaints:
        supporters = [{
            'id': str(s.user.id),
            'name': f"{s.user.first_name} {s.user.last_name}".strip() or s.user.email,
            'email': s.user.email,
            'phone': s.user.phone_number,
            'supported_at': s.supported_at,
        } for s in c.supports.select_related('user').all()]

        total_supports = c.supports.count() if c.supports.exists() else c.support_count

        data.append({
            'id': str(c.id),
            'complaint_number': str(c.id),
            'tracking_id': c.tracking_id,
            'title': c.title,
            'description': c.description,
            'location': c.location,
            'latitude': c.latitude,
            'longitude': c.longitude,
            'created_at': c.created_at,
            'citizen': {
                'email': c.user.email,
                'name': f"{c.user.first_name} {c.user.last_name}".strip(),
                'phone': c.user.phone_number,
                'address': c.user.address,
                'city': c.user.city,
                'state': c.user.state,
            },
            'volunteer': {
                'email': c.verified_by_volunteer_user.email if c.verified_by_volunteer_user else 'N/A',
                'name': f"{c.verified_by_volunteer_user.first_name} {c.verified_by_volunteer_user.last_name}".strip() if c.verified_by_volunteer_user else 'N/A'
            },
            'verification_notes': c.verification_notes,
            'verification_images': [
                {'id': str(vi.id), 'url': request.build_absolute_uri(vi.image.url), 'uploaded_at': vi.uploaded_at}
                for vi in c.verification_images.all()
            ],
            'documents': [{
                'id': str(doc.id),
                'file_name': doc.file_name,
                'file_size': doc.file_size,
                'file': request.build_absolute_uri(doc.file.url),
                'uploaded_at': doc.uploaded_at,
            } for doc in c.documents.all()],
            'support_total': total_supports,
            'total_supports': total_supports,
            'supporters': supporters,
            'supporter_details': [
                {
                    'name': supporter['name'],
                    'email': supporter['email'],
                }
                for supporter in supporters
            ],
            'volunteer_verification_timestamp': c.volunteer_verification_timestamp,
            'ward': c.ward,
            'zone': c.zone,
            'area': c.area_name,
            'category': c.category,
            'department': c.department,
            'status': c.status,
            'flag_for_admin_review': c.flag_for_admin_review,
            'admin_review_reason': c.admin_review_reason
        })
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_verify_complaint(request, complaint_id):
    """
    Admin verifies or rejects volunteer's verification proof.
    Body: {"action": "accept"|"reject", "reason": "..."}
    
    If accepted: complaint becomes public (is_public=True, admin_verified=True)
    If rejected: volunteer verification is marked as invalid
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        complaint = Complaint.objects.get(id=complaint_id)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not complaint.verified_by_volunteer:
        return Response({'error': 'Complaint not verified by volunteer'}, status=status.HTTP_400_BAD_REQUEST)
    
    action = request.data.get('action')
    reason = request.data.get('reason', '')
    
    if action == 'accept':
        complaint.admin_verified = True
        complaint.admin_verification_timestamp = now()
        complaint.is_public = True
        complaint.status = 'in_progress'
        entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': 'admin_verified', 'reason': reason}
        complaint.status_history = complaint.status_history + [entry]
        complaint.save()
        _send_complaint_status_notification(
            request,
            complaint,
            event_title='Approved by Admin',
            actor_email=request.user.email,
            reason=reason,
        )
        return Response({'message': 'Complaint verified by admin and now public'}, status=status.HTTP_200_OK)
    
    elif action == 'reject':
        volunteer_email = complaint.verified_by_volunteer_user.email if complaint.verified_by_volunteer_user else None
        complaint.verified_by_volunteer = False
        complaint.verified_by_volunteer_user = None
        complaint.volunteer_verification_timestamp = None
        complaint.admin_verified = False
        complaint.is_public = False
        complaint.status = 'rejected'
        complaint.admin_review_reason = reason
        entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': 'admin_rejected', 'reason': reason}
        complaint.status_history = complaint.status_history + [entry]
        complaint.save()
        _send_complaint_status_notification(
            request,
            complaint,
            event_title='Rejected by Admin',
            actor_email=request.user.email,
            reason=reason,
            extra_recipients=[volunteer_email] if volunteer_email else None,
        )
        return Response({'message': 'Volunteer verification rejected by admin'}, status=status.HTTP_200_OK)
    
    else:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


# ==================== VOLUNTEER MANAGEMENT (ADMIN) ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_volunteers_list(request):
    """
    Admin endpoint: List all volunteers with their details.
    /api/admin/volunteers/
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    volunteers = Volunteer.objects.select_related('user').all().order_by('user__email')
    
    # Filter by approval status
    approval = request.query_params.get('approval')
    if approval == 'approved':
        volunteers = volunteers.filter(is_approved=True)
    elif approval == 'pending':
        volunteers = volunteers.filter(is_approved=False)
    
    data = []
    for vol in volunteers:
        data.append({
            'id': str(vol.id),
            'user': {
                'id': vol.user.id,
                'email': vol.user.email,
                'name': f"{vol.user.first_name} {vol.user.last_name}".strip(),
                'phone': vol.user.phone_number,
                'address': vol.user.address,
                'city': vol.user.city
            },
            'ward': vol.ward,
            'zone': vol.zone,
            'area': vol.area,
            'is_approved': vol.is_approved,
            'verifications_count': vol.user.verified_complaints.count()
        })
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_approve_volunteer(request, volunteer_id):
    """
    Admin approves or blocks a volunteer.
    Body: {"action": "approve"|"block"}
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        vol = Volunteer.objects.get(id=volunteer_id)
    except Volunteer.DoesNotExist:
        return Response({'error': 'Volunteer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    action = request.data.get('action')
    
    if action == 'approve':
        vol.is_approved = True
        vol.save()
        return Response({'message': 'Volunteer approved'}, status=status.HTTP_200_OK)
    elif action == 'block':
        vol.is_approved = False
        vol.save()
        return Response({'message': 'Volunteer blocked'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_volunteer(request):
    """
    Admin creates a new volunteer from existing user.
    Body: {"user_id": <id>, "ward": "...", "zone": "...", "area": "..."}
    OR (legacy): {"email": "...", "ward": "...", "zone": "...", "area": "..."}
    """
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    # Accept either user_id or email
    user_id = request.data.get('user_id')
    email = request.data.get('email')
    ward = request.data.get('ward')
    zone = request.data.get('zone')
    area = request.data.get('area')
    
    if not all([ward, zone, area]):
        return Response({'error': 'ward, zone, area are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get user by ID or email
    if user_id:
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    elif email:
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'error': 'user_id or email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if volunteer profile already exists
    vol, created = Volunteer.objects.get_or_create(
        user=user,
        defaults={'ward': ward, 'zone': zone, 'area': area, 'is_approved': False}
    )
    
    if not created:
        vol.ward = ward
        vol.zone = zone
        vol.area = area
        vol.save()
    
    from app.serializers import VolunteerSerializer
    serializer = VolunteerSerializer(vol)
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


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
            'url': request.build_absolute_uri(doc.file.url),
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
    Shows ALL complaints marked is_public=True, regardless of verification status.
    Includes volunteer verification notes and admin notes.
    Supports filtering by department, category, status.
    """
    # Get all complaints marked as public
    complaints = Complaint.objects.filter(is_public=True).order_by('-created_at')
    
    # Filtering
    department = request.query_params.get('department')
    category = request.query_params.get('category')
    status_filter = request.query_params.get('status')
    ward = request.query_params.get('ward')
    zone = request.query_params.get('zone')
    
    if department:
        complaints = complaints.filter(department=department)
    if category:
        complaints = complaints.filter(category=category)
    if status_filter:
        complaints = complaints.filter(status=status_filter)
    if ward:
        complaints = complaints.filter(ward=ward)
    if zone:
        complaints = complaints.filter(zone=zone)
    
    data = [{
        'id': str(c.id),
        'tracking_id': c.tracking_id,
        'title': c.title,
        'description': c.description,
        'department': c.department,
        'category': c.category,
        'priority': c.priority,
        'sentiment': c.sentiment,
        'support_count': c.support_count,
        'status': c.status,
        'created_at': c.created_at,
        'location': c.location,
        'latitude': c.latitude,
        'longitude': c.longitude,
        'ward': c.ward,
        'zone': c.zone,
        'area': c.area_name,
        'verified_by_volunteer': c.verified_by_volunteer,
        'admin_verified': c.admin_verified,
        'verification_notes': c.verification_notes or '',
        'admin_review_reason': c.admin_review_reason or '',
        'flag_for_admin_review': c.flag_for_admin_review,
        'documents_count': c.documents.count(),
        'documents': [{
            'id': str(doc.id),
            'name': doc.file_name,
            'url': request.build_absolute_uri(doc.file.url),
            'size': doc.file_size
        } for doc in c.documents.all()],
        'verification_images_count': c.verification_images.count(),
        'verification_images': [{
            'id': str(img.id),
            'url': request.build_absolute_uri(img.image.url),
            'uploaded_at': img.uploaded_at
        } for img in c.verification_images.all()]
    } for c in complaints]
    
    return Response(data)


# ==================== MODULE 5: SUPPORT/VOTING SYSTEM ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def support_complaint(request, complaint_id):
    """
    Support a complaint as an authenticated user.
    Prevents duplicate support from same user.
    """
    try:
        complaint = Complaint.objects.get(id=complaint_id)
        supporter = request.user
        if not supporter.profile_complete:
            return Response({'error': 'Complete your profile before supporting complaints'}, status=status.HTTP_400_BAD_REQUEST)

        support_obj, created = ComplaintSupport.objects.get_or_create(
            complaint=complaint,
            user=supporter,
        )
        if not created:
            return Response(
                {'error': 'You have already supported this complaint', 'support_count': complaint.support_count},
                status=status.HTTP_400_BAD_REQUEST
            )

        complaint.support_count = complaint.supports.count()
        complaint.save(update_fields=['support_count', 'updated_at'])
        
        return Response({
            'id': str(complaint.id),
            'support_count': complaint.support_count,
            'supported_at': support_obj.supported_at,
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
        'documents_count': c.documents.count(),
        'documents': [{
            'id': str(doc.id),
            'file_name': doc.file_name,
            'file_size': doc.file_size,
            'file': request.build_absolute_uri(doc.file.url),
            'uploaded_at': doc.uploaded_at,
        } for doc in c.documents.all()]
    } for c in complaints]
    
    return Response(data)


@api_view(['PATCH', 'POST'])
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
            reason = request.data.get('reason', '')
            complaint.status = new_status
            entry = {'ts': now().isoformat(), 'actor': request.user.email, 'action': f'status:{new_status}'}
            complaint.status_history = complaint.status_history + [entry]
            complaint.save()
            _send_complaint_status_notification(
                request,
                complaint,
                event_title='Status Updated by Admin',
                actor_email=request.user.email,
                reason=reason or f'New status: {new_status}',
            )
        
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


# ==================== VOLUNTEER MANAGEMENT ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_users(request):
    """
    Get list of users who are not yet volunteers.
    Only accessible to authenticated users (preferably admins).
    """
    try:
        # Get all users except those who already have a volunteer profile
        users = CustomUser.objects.filter(
            volunteer_profile__isnull=True
        ).values('id', 'email', 'first_name', 'last_name')
        
        return Response(list(users), status=status.HTTP_200_OK)
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching available users: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to fetch available users'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_volunteer(request, volunteer_id):
    """
    Delete a volunteer (soft delete - marks as deleted).
    """
    try:
        volunteer = Volunteer.objects.get(id=volunteer_id)
        volunteer.delete()
        return Response(
            {'success': True, 'message': 'Volunteer deleted successfully'},
            status=status.HTTP_200_OK
        )
    except Volunteer.DoesNotExist:
        return Response(
            {'error': 'Volunteer not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error deleting volunteer: {str(e)}", exc_info=True)
        return Response(
            {'error': f'Failed to delete volunteer: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ==================== HELPER FUNCTIONS ====================

# NOTE: Department prediction is now handled by AI module
# See: app/ai/predict.py for predict_department() function
# This provides ML-based prediction with confidence scores



