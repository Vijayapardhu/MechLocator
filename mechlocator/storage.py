"""
Custom storage backends for Supabase integration
"""
import os
import requests
from django.conf import settings
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.utils.deconstruct import deconstructible


@deconstructible
class SupabaseStorage(Storage):
    """
    Custom storage backend for Supabase using REST API
    """
    
    def __init__(self, bucket_name='media'):
        self.bucket_name = bucket_name
        self.base_url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket_name}"
        self.service_key = settings.SUPABASE_SERVICE_ROLE_KEY
    
    def _get_headers(self):
        return {
            'Authorization': f'Bearer {self.service_key}',
            'Content-Type': 'application/octet-stream'
        }
    
    def _open(self, name, mode='rb'):
        """
        Retrieve the specified file from storage.
        """
        url = f"{self.base_url}/{name}"
        response = requests.get(url, headers=self._get_headers())
        
        if response.status_code == 200:
            return ContentFile(response.content, name=name)
        else:
            raise FileNotFoundError(f"File {name} not found in Supabase storage")
    
    def _save(self, name, content):
        """
        Save new content to the file named given name.
        """
        url = f"{self.base_url}/{name}"
        headers = self._get_headers()
        
        # Reset file pointer to beginning
        content.seek(0)
        file_content = content.read()
        
        response = requests.post(
            url,
            data=file_content,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            return name
        else:
            raise Exception(f"Failed to upload {name} to Supabase: {response.text}")
    
    def delete(self, name):
        """
        Delete the specified file from storage.
        """
        url = f"{self.base_url}/{name}"
        response = requests.delete(url, headers=self._get_headers())
        
        if response.status_code not in [200, 204]:
            raise Exception(f"Failed to delete {name} from Supabase: {response.text}")
    
    def exists(self, name):
        """
        Return True if a file referenced by the given name already exists.
        """
        url = f"{self.base_url}/{name}"
        response = requests.head(url, headers=self._get_headers())
        return response.status_code == 200
    
    def listdir(self, path):
        """
        List the contents of the specified path.
        """
        # This is a simplified implementation
        # For full directory listing, you'd need to use Supabase's list API
        return [], []
    
    def size(self, name):
        """
        Return the total size, in bytes, of the file specified by name.
        """
        url = f"{self.base_url}/{name}"
        response = requests.head(url, headers=self._get_headers())
        
        if response.status_code == 200:
            return int(response.headers.get('Content-Length', 0))
        else:
            return 0
    
    def url(self, name):
        """
        Return an absolute URL where the file's contents can be accessed directly.
        """
        return f"{self.base_url}/{name}"


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
