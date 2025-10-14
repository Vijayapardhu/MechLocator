"""
Custom storage backends for Supabase integration
"""
import os
import requests
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.utils.deconstruct import deconstructible


@deconstructible
class SupabaseStorage(FileSystemStorage):
    """
    Custom storage backend that stores files locally and uploads to Supabase
    """
    
    def __init__(self, bucket_name='media'):
        self.bucket_name = bucket_name
        self.supabase_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}"
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY
        # Use local storage for actual file storage
        super().__init__()
    
    def _save(self, name, content):
        """
        Save file locally and then upload to Supabase
        """
        # Save locally first
        saved_name = super()._save(name, content)
        
        # Upload to Supabase if not in DEBUG mode
        if not settings.DEBUG:
            self._upload_to_supabase(saved_name)
        
        return saved_name
    
    def _upload_to_supabase(self, name):
        """
        Upload file to Supabase storage
        """
        try:
            local_path = self.path(name)
            if os.path.exists(local_path):
                with open(local_path, 'rb') as f:
                    file_content = f.read()
                
                url = f"{settings.SUPABASE_URL}/storage/v1/object/{self.bucket_name}/{name}"
                headers = {
                    'Authorization': f'Bearer {self.service_key}',
                    'apikey': self.service_key,
                    'Content-Type': 'application/octet-stream'
                }
                
                response = requests.post(url, data=file_content, headers=headers)
                if response.status_code not in [200, 201]:
                    print(f"Failed to upload {name} to Supabase: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error uploading {name} to Supabase: {str(e)}")
    
    def url(self, name):
        """
        Return an absolute URL where the file's contents can be accessed directly.
        For production, return Supabase URL. For development, return local URL.
        """
        if settings.DEBUG:
            # In development, serve from local storage
            return super().url(name)
        else:
            # In production, serve from Supabase
            return f"{self.supabase_url}/{name}"


class SupabaseMediaStorage(SupabaseStorage):
    """
    Custom storage backend for Supabase media files
    """
    def __init__(self):
        super().__init__(bucket_name='media')


class SupabaseStaticStorage(SupabaseStorage):
    """
    Custom storage backend for Supabase static files
    """
    def __init__(self):
        super().__init__(bucket_name='static')
