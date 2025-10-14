"""
Management command to sync local media files to Supabase storage
"""
import os
import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files.storage import default_storage


class Command(BaseCommand):
    help = 'Sync local media files to Supabase storage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be uploaded without actually uploading',
        )

    def handle(self, *args, **options):
        if not hasattr(settings, 'SUPABASE_SERVICE_ROLE_KEY'):
            self.stdout.write(
                self.style.ERROR('SUPABASE_SERVICE_ROLE_KEY not configured')
            )
            return

        if not hasattr(settings, 'SUPABASE_URL'):
            self.stdout.write(
                self.style.ERROR('SUPABASE_URL not configured')
            )
            return

        bucket_name = 'media'
        supabase_url = settings.SUPABASE_URL
        service_key = settings.SUPABASE_SERVICE_ROLE_KEY

        # Get all files in the media directory
        media_dir = settings.MEDIA_ROOT
        if not os.path.exists(media_dir):
            self.stdout.write(
                self.style.ERROR(f'Media directory {media_dir} does not exist')
            )
            return

        uploaded_count = 0
        error_count = 0

        for root, dirs, files in os.walk(media_dir):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, media_dir)
                
                # Convert Windows path separators to forward slashes
                relative_path = relative_path.replace('\\', '/')
                
                self.stdout.write(f'Processing: {relative_path}')
                
                if options['dry_run']:
                    self.stdout.write(
                        self.style.WARNING(f'Would upload: {relative_path}')
                    )
                    continue
                
                try:
                    with open(file_path, 'rb') as f:
                        file_content = f.read()
                    
                    url = f"{supabase_url}/storage/v1/object/{bucket_name}/{relative_path}"
                    headers = {
                        'Authorization': f'Bearer {service_key}',
                        'apikey': service_key,
                        'Content-Type': 'application/octet-stream'
                    }
                    
                    response = requests.post(url, data=file_content, headers=headers)
                    
                    if response.status_code in [200, 201]:
                        self.stdout.write(
                            self.style.SUCCESS(f'✓ Uploaded: {relative_path}')
                        )
                        uploaded_count += 1
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f'✗ Failed to upload {relative_path}: '
                                f'{response.status_code} - {response.text}'
                            )
                        )
                        error_count += 1
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'✗ Error uploading {relative_path}: {str(e)}')
                    )
                    error_count += 1

        if options['dry_run']:
            self.stdout.write(
                self.style.SUCCESS('Dry run completed. No files were actually uploaded.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Sync completed. Uploaded: {uploaded_count}, Errors: {error_count}'
                )
            )
