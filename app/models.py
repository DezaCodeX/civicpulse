from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group, Permission
from django.db import models
from django.utils import timezone
import uuid

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    firebase_uid = models.CharField(max_length=255, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    ward = models.CharField(max_length=50, blank=True, null=True)
    zone = models.CharField(max_length=50, blank=True, null=True)
    area = models.CharField(max_length=100, blank=True, null=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="customuser_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="customuser_set",
        related_query_name="user",
    )

    def __str__(self):
        return self.email

    @property
    def profile_complete(self):
        """Simple profile completeness check used for support eligibility."""
        required = [self.first_name, self.phone_number, self.address, self.city]
        return all(bool(x) for x in required)

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='complaints')
    
    title = models.CharField(max_length=200, default='No Title')
    description = models.TextField()
    category = models.CharField(max_length=100)
    
    # AI-based department classification
    department = models.CharField(max_length=100, blank=True, null=True)
    
    # Geolocation data
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    # Location intelligence fields (Phase 4)
    ward = models.CharField(max_length=50, blank=True, null=True)
    zone = models.CharField(max_length=50, blank=True, null=True)
    door_no = models.CharField(max_length=50, blank=True, null=True)
    area_name = models.CharField(max_length=100, blank=True, null=True)

    # Volunteer verification
    verified_by_volunteer = models.BooleanField(default=False)
    verified_by_volunteer_user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_complaints')
    verification_notes = models.TextField(blank=True)
    volunteer_verification_timestamp = models.DateTimeField(null=True, blank=True)
    
    # Admin verification of volunteer proof
    admin_verified = models.BooleanField(default=False)
    admin_verification_timestamp = models.DateTimeField(null=True, blank=True)
    
    # File validation flags
    flag_for_admin_review = models.BooleanField(default=False)
    admin_review_reason = models.TextField(blank=True)

    # Tracking & history
    tracking_id = models.CharField(max_length=12, unique=True, blank=True, null=True)
    status_history = models.JSONField(default=list)

    # Escalation flag
    is_escalated = models.BooleanField(default=False)
    
    # Status and engagement
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    support_count = models.IntegerField(default=0)
    
    # Privacy control
    is_public = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['department', '-created_at']),
            models.Index(fields=['tracking_id']),
        ]

    def __str__(self):
        return f"{self.title} - {self.status}"

    def save(self, *args, **kwargs):
        # Ensure a tracking_id is generated on first save
        if not self.tracking_id:
            self.tracking_id = str(uuid.uuid4())[:12].upper()
        super().save(*args, **kwargs)


class ComplaintDocument(models.Model):
    """Store multiple file attachments for each complaint"""
    complaint = models.ForeignKey(
        Complaint,
        related_name='documents',
        on_delete=models.CASCADE
    )
    file = models.FileField(upload_to='complaints/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()  # in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} - {self.complaint.title}"


class Volunteer(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='volunteer_profile')
    ward = models.CharField(max_length=50)
    zone = models.CharField(max_length=50)
    area = models.CharField(max_length=100)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"Volunteer: {self.user.email} ({self.ward})"


class VerificationImage(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='verification_images')
    image = models.ImageField(upload_to='verification/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"VerificationImage for {self.complaint.id} at {self.uploaded_at}"


class CivicContact(models.Model):
    CONTACT_TYPES = [
        ('email', 'Email'),
        ('portal', 'Portal'),
    ]
    department = models.CharField(max_length=100)
    ward = models.CharField(max_length=50, blank=True, null=True)
    office_name = models.CharField(max_length=100)
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPES)
    contact_value = models.TextField()
    verified = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.office_name} ({self.department})"

