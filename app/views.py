from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, RegisterSerializer, CustomUserSerializer, ComplaintSerializer
from .models import CustomUser, Complaint
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

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


