from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0013_complaintsupport'),
    ]

    operations = [
        migrations.AddField(
            model_name='verificationimage',
            name='volunteer',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='verification_images_uploaded',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
