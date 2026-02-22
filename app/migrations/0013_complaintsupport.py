from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0012_complaint_priority_complaint_sentiment'),
    ]

    operations = [
        migrations.CreateModel(
            name='ComplaintSupport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('supported_at', models.DateTimeField(auto_now_add=True)),
                ('complaint', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='supports', to='app.complaint')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='supported_complaints', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-supported_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='complaintsupport',
            constraint=models.UniqueConstraint(fields=('complaint', 'user'), name='unique_user_support_per_complaint'),
        ),
    ]
