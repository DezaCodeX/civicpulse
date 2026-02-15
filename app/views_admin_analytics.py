from datetime import datetime, time
from django.db.models import Count
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import status
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
        .values('id', 'latitude', 'longitude', 'category', 'department', 'status')
    )
    return Response(list(data))


def _parse_datetime_param(value, is_end=False):
    if not value:
        return None

    parsed_dt = parse_datetime(value)
    if parsed_dt:
        if timezone.is_naive(parsed_dt):
            parsed_dt = timezone.make_aware(parsed_dt)
        return parsed_dt

    parsed_date = parse_date(value)
    if parsed_date:
        return timezone.make_aware(
            datetime.combine(parsed_date, time.max if is_end else time.min)
        )

    return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_complaints_excel(request):
    if not is_admin(request.user):
        return Response({'error': 'Unauthorized'}, status=403)

    try:
        import pandas as pd
    except ImportError:
        return Response({'error': 'pandas is required for Excel export'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        queryset = Complaint.objects.all().order_by('-created_at')

        department = request.query_params.get('department')
        if department:
            queryset = queryset.filter(department__iexact=department)

        start_dt = _parse_datetime_param(request.query_params.get('start_date'))
        end_dt = _parse_datetime_param(request.query_params.get('end_date'), is_end=True)

        if start_dt:
            queryset = queryset.filter(created_at__gte=start_dt)
        if end_dt:
            queryset = queryset.filter(created_at__lte=end_dt)

        data = list(queryset.values(
            'id',
            'tracking_id',
            'title',
            'description',
            'department',
            'category',
            'sentiment',
            'priority',
            'status',
            'support_count',
            'ward',
            'zone',
            'area_name',
            'location',
            'latitude',
            'longitude',
            'created_at',
            'updated_at'
        ))

        df = pd.DataFrame(data)
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=complaints.xlsx'
        df.to_excel(response, index=False)
        return response
    except Exception as e:
        return Response({'error': f'Failed to export Excel: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
