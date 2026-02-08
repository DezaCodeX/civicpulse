from rest_framework import serializers
from .models import CustomUser, Complaint, ComplaintDocument, Volunteer, VerificationImage, CivicContact
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'first_name', 'last_name', 'address', 'city', 'state', 'phone_number', 'ward', 'zone', 'area', 'is_staff', 'is_superuser')

class ComplaintDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintDocument
        fields = ('id', 'file_name', 'file_size', 'file', 'uploaded_at')


class VerificationImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationImage
        fields = ('id', 'image', 'uploaded_at')

class ComplaintSerializer(serializers.ModelSerializer):
    documents = ComplaintDocumentSerializer(many=True, read_only=True)
    verification_images = VerificationImageSerializer(many=True, read_only=True)
    user = CustomUserSerializer(read_only=True)
    verified_by_volunteer_user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = Complaint
        fields = ('id', 'title', 'description', 'category', 'department', 'latitude', 
                  'longitude', 'location', 'ward', 'zone', 'door_no', 'area_name',
                  'status', 'support_count', 'is_public', 'verified_by_volunteer', 'verified_by_volunteer_user',
                  'verification_notes', 'volunteer_verification_timestamp', 'admin_verified', 'admin_verification_timestamp',
                  'flag_for_admin_review', 'admin_review_reason',
                  'tracking_id', 'status_history', 'is_escalated', 'documents', 'verification_images', 'user', 'created_at', 'updated_at')
        read_only_fields = ('id', 'category', 'department', 'support_count', 'user', 'created_at', 'updated_at', 'verified_by_volunteer_user', 'volunteer_verification_timestamp', 'admin_verified', 'admin_verification_timestamp')


class VolunteerSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    class Meta:
        model = Volunteer
        fields = ('id', 'user', 'ward', 'zone', 'area', 'is_approved')


class CivicContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CivicContact
        fields = ('id', 'department', 'ward', 'office_name', 'contact_type', 'contact_value', 'verified')

class ComplaintCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating complaints (handles file uploads separately)"""
    class Meta:
        model = Complaint
        fields = ('title', 'description', 'latitude', 'longitude', 'location')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'password', 'password2', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = CustomUser.objects.create(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        return token
