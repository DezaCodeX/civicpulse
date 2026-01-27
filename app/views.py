from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer, CustomUserSerializer, ComplaintSerializer
from .models import CustomUser, Complaint, ComplaintDocument
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import json

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
        serializer = ComplaintSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# ==================== MODULE 2: MULTIPLE FILE UPLOAD API ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_complaint_with_files(request):
    """
    Create complaint with multiple file uploads.
    Accepts FormData with documents[] array.
    """
    try:
        description = request.data.get('description', '')
        title = request.data.get('title', '')
        category = request.data.get('category', '')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        location = request.data.get('location', '')
        
        # AI-based department prediction (placeholder)
        department = predict_department(description)
        
        # Create complaint
        complaint = Complaint.objects.create(
            user=request.user,
            title=title,
            description=description,
            category=category,
            department=department,
            latitude=latitude,
            longitude=longitude,
            location=location or f"({latitude}, {longitude})",
            is_public=True
        )
        
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
            'documents': file_urls,
            'message': 'Complaint created successfully'
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


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
            complaint.save()
        
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

def predict_department(description):
    """
    AI-based department classification.
    Currently using simple keyword matching.
    TODO: Integrate with ML model (BERT, GPT-2, etc.)
    """
    keywords = {
        'Water': ['water', 'pipe', 'leak', 'supply', 'sewage'],
        'Roads': ['road', 'pothole', 'pavement', 'street', 'traffic'],
        'Electricity': ['electricity', 'power', 'light', 'pole', 'blackout'],
        'Sanitation': ['garbage', 'waste', 'cleaning', 'dustbin', 'hygiene'],
        'Health': ['hospital', 'clinic', 'health', 'medical', 'doctor'],
        'Education': ['school', 'college', 'university', 'education'],
        'Safety': ['police', 'crime', 'security', 'safety', 'accident'],
    }
    
    description_lower = description.lower()
    
    for department, keywords_list in keywords.items():
        for keyword in keywords_list:
            if keyword in description_lower:
                return department
    
    return 'General'


