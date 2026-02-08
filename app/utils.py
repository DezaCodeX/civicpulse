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


def validate_verification_image(file_obj, complaint):
    """
    Comprehensive validation for volunteer verification images.
    
    Checks:
    1. File exists and is not None
    2. File type is image (JPEG, PNG, GIF, WebP)
    3. Hash comparison for duplicates
    4. Blur detection (returns warning if blurry)
    5. File size check (max 10MB)
    
    Returns: {
        'is_valid': bool,
        'errors': [list of error messages],
        'warnings': [list of warning messages],
        'should_flag_for_review': bool
    }
    """
    result = {
        'is_valid': True,
        'errors': [],
        'warnings': [],
        'should_flag_for_review': False
    }
    
    # Check 1: File exists
    if not file_obj:
        result['is_valid'] = False
        result['errors'].append('No file provided')
        return result
    
    # Check 2: File type
    ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
    content_type = getattr(file_obj, 'content_type', '')
    
    if content_type not in ALLOWED_IMAGE_TYPES:
        result['is_valid'] = False
        result['errors'].append(f'Invalid file type. Allowed: JPEG, PNG, GIF, WebP. Got: {content_type}')
    
    # Check 3: File size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_size = getattr(file_obj, 'size', 0)
    
    if file_size > max_size:
        result['is_valid'] = False
        result['errors'].append(f'File size too large. Max: 10MB, Got: {file_size / (1024*1024):.2f}MB')
    
    # Check 4: Hash comparison for duplicates
    if complaint and result['is_valid']:
        try:
            img_hash = get_image_hash(file_obj)
            existing_hashes = set()
            
            for vi in complaint.verification_images.all():
                try:
                    existing_img_hash = get_image_hash(vi.image)
                    existing_hashes.add(existing_img_hash)
                except Exception:
                    pass
            
            if img_hash and img_hash in existing_hashes:
                result['is_valid'] = False
                result['errors'].append('This image has already been uploaded for this complaint')
                result['should_flag_for_review'] = True
        except Exception as e:
            result['warnings'].append(f'Could not verify duplicates: {str(e)}')
    
    # Check 5: Blur detection
    if result['is_valid']:
        try:
            is_blurry = check_image_blur(file_obj)
            if is_blurry:
                result['warnings'].append('Image appears to be blurry. Please upload a clearer photo for better verification.')
                result['should_flag_for_review'] = True
        except Exception as e:
            result['warnings'].append(f'Could not check image quality: {str(e)}')
    
    return result

