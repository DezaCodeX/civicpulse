import requests
import hashlib
import csv
import io
from django.http import HttpResponse
from io import BytesIO
from datetime import datetime

def reverse_geocode(lat, lon, provider='nominatim'):
    """
    Attempt to reverse-geocode lat/lon into ward/zone/area_name using OpenStreetMap Nominatim.
    Returns dict with possible keys: ward, zone, area_name
    """
    try:
        url = 'https://nominatim.openstreetmap.org/reverse'
        params = {'format': 'jsonv2', 'lat': lat, 'lon': lon, 'addressdetails': 1}
        headers = {'User-Agent': 'civicpulse/1.0'}
        r = requests.get(url, params=params, headers=headers, timeout=5)
        r.raise_for_status()
        data = r.json()
        addr = data.get('address', {})
        return {
            'ward': addr.get('neighbourhood') or addr.get('suburb') or addr.get('quarter'),
            'zone': addr.get('city_district') or addr.get('county') or addr.get('state_district'),
            'area_name': addr.get('road') or addr.get('pedestrian') or addr.get('neighbourhood') or addr.get('suburb')
        }
    except Exception:
        return {}


def get_image_hash(file_obj):
    """Compute MD5 hash of image file for duplicate detection."""
    try:
        hasher = hashlib.md5()
        for chunk in file_obj.chunks():
            hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None


def check_image_blur(file_obj):
    """
    Simple blur detection using Laplacian variance.
    Returns True if image is blurry (threshold=100), False otherwise.
    """
    try:
        import cv2
        import numpy as np
        from PIL import Image
        
        # Read image from file
        img_array = np.frombuffer(file_obj.read(), np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            return False
        
        # Laplacian variance
        laplacian_var = cv2.Laplacian(img, cv2.CV_64F).var()
        file_obj.seek(0)  # Reset file pointer
        return laplacian_var < 100  # True if blurry
    except ImportError:
        # OpenCV not installed; skip check
        return False
    except Exception:
        return False


def export_complaint_csv(complaint):
    """
    Export single complaint as CSV string.
    Returns CSV as string.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Field', 'Value'])
    writer.writerow(['Tracking ID', complaint.tracking_id or complaint.id])
    writer.writerow(['Title', complaint.title])
    writer.writerow(['Description', complaint.description])
    writer.writerow(['Department', complaint.department])
    writer.writerow(['Category', complaint.category])
    writer.writerow(['Ward', complaint.ward or 'N/A'])
    writer.writerow(['Zone', complaint.zone or 'N/A'])
    writer.writerow(['Area', complaint.area_name or 'N/A'])
    writer.writerow(['Status', complaint.status])
    writer.writerow(['Verified', 'Yes' if complaint.verified_by_volunteer else 'No'])
    writer.writerow(['Support Count', complaint.support_count])
    writer.writerow(['Escalated', 'Yes' if complaint.is_escalated else 'No'])
    writer.writerow(['Created', complaint.created_at.isoformat()])
    writer.writerow(['Updated', complaint.updated_at.isoformat()])
    if complaint.verification_notes:
        writer.writerow(['Verification Notes', complaint.verification_notes])
    return output.getvalue()


def export_complaint_pdf_simple(complaint):
    """
    Simple PDF export using reportlab (if available).
    Falls back to HTML format if reportlab not installed.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import inch
        
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        y = height - inch
        c.setFont("Helvetica-Bold", 16)
        c.drawString(inch, y, f"Complaint Report: {complaint.tracking_id or complaint.id}")
        y -= 0.3 * inch
        
        c.setFont("Helvetica", 10)
        lines = [
            f"Title: {complaint.title}",
            f"Department: {complaint.department}",
            f"Status: {complaint.status}",
            f"Ward: {complaint.ward or 'N/A'}",
            f"Zone: {complaint.zone or 'N/A'}",
            f"Verified: {'Yes' if complaint.verified_by_volunteer else 'No'}",
            f"Support Count: {complaint.support_count}",
            f"Escalated: {'Yes' if complaint.is_escalated else 'No'}",
            "",
            "Description:",
        ]
        for line in lines:
            if y < inch:
                c.showPage()
                y = height - inch
            c.drawString(inch, y, line)
            y -= 0.2 * inch
        
        # Wrap description
        desc_lines = [complaint.description[i:i+80] for i in range(0, len(complaint.description), 80)]
        for line in desc_lines:
            if y < inch:
                c.showPage()
                y = height - inch
            c.drawString(inch + 0.2 * inch, y, line)
            y -= 0.2 * inch
        
        c.save()
        buffer.seek(0)
        return buffer.getvalue()
    except ImportError:
        # reportlab not available; return as simple text
        text = f"Complaint Report: {complaint.tracking_id or complaint.id}\n\n"
        text += f"Title: {complaint.title}\n"
        text += f"Department: {complaint.department}\n"
        text += f"Status: {complaint.status}\n"
        text += f"Description:\n{complaint.description}\n"
        return text.encode('utf-8')
