from django.db.models import Count
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Complaint


def is_admin(user):
    return user.is_staff or user.is_superuser


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_analytics(request):
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    data = (
        Complaint.objects
        .values('category')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    return Response(list(data))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_analytics(request):
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    data = (
        Complaint.objects
        .values('status')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    return Response(list(data))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_trend(request):
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    data = (
        Complaint.objects
        .annotate(day=TruncDay('created_at'))
        .values('day')
        .annotate(count=Count('id'))
        .order_by('day')
    )
    return Response(list(data))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def weekly_trend(request):
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    data = (
        Complaint.objects
        .annotate(week=TruncWeek('created_at'))
        .values('week')
        .annotate(count=Count('id'))
        .order_by('week')
    )
    return Response(list(data))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_trend(request):
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    data = (
        Complaint.objects
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(count=Count('id'))
        .order_by('month')
    )
    return Response(list(data))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def location_data(request):
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    data = (
        Complaint.objects
        .filter(latitude__isnull=False, longitude__isnull=False)
        .values('id', 'latitude', 'longitude', 'category', 'status')
    )
    return Response(list(data))
