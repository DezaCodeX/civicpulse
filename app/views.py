from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# Create your views here.
def test_api(request):
    return JsonResponse({'message': 'Hello, world!'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    return Response({
        "username": request.user.username,
        "email": request.user.email
    })

