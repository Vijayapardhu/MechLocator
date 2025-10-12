"""
Utility functions for Supabase storage integration.
"""
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def get_supabase_client():
    """Get initialized Supabase client."""
    try:
        from supabase import create_client, Client
        
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_KEY
        
        if not url or not key:
            logger.warning("Supabase credentials not configured")
            return None
            
        supabase: Client = create_client(url, key)
        return supabase
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        return None


def upload_to_supabase(file_obj, file_path, bucket_name=None):
    """
    Upload a file to Supabase storage.
    
    Args:
        file_obj: Django file object
        file_path: Path where the file should be stored in the bucket
        bucket_name: Name of the Supabase bucket (defaults to settings.SUPABASE_BUCKET)
    
    Returns:
        str: Public URL of the uploaded file, or None if upload failed
    """
    if bucket_name is None:
        bucket_name = settings.SUPABASE_BUCKET
    
    try:
        supabase = get_supabase_client()
        if not supabase:
            logger.warning("Supabase not configured, using local storage")
            return None
        
        # Read file content
        file_content = file_obj.read()
        
        # Upload to Supabase Storage
        response = supabase.storage.from_(bucket_name).upload(
            file_path,
            file_content,
            file_options={"content-type": file_obj.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
        
        logger.info(f"File uploaded to Supabase: {file_path}")
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to upload to Supabase: {str(e)}")
        return None


def delete_from_supabase(file_path, bucket_name=None):
    """
    Delete a file from Supabase storage.
    
    Args:
        file_path: Path of the file in the bucket
        bucket_name: Name of the Supabase bucket (defaults to settings.SUPABASE_BUCKET)
    
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    if bucket_name is None:
        bucket_name = settings.SUPABASE_BUCKET
    
    try:
        supabase = get_supabase_client()
        if not supabase:
            logger.warning("Supabase not configured")
            return False
        
        # Delete from Supabase Storage
        supabase.storage.from_(bucket_name).remove([file_path])
        
        logger.info(f"File deleted from Supabase: {file_path}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to delete from Supabase: {str(e)}")
        return False


def get_public_url(file_path, bucket_name=None):
    """
    Get the public URL for a file in Supabase storage.
    
    Args:
        file_path: Path of the file in the bucket
        bucket_name: Name of the Supabase bucket (defaults to settings.SUPABASE_BUCKET)
    
    Returns:
        str: Public URL of the file, or None if operation failed
    """
    if bucket_name is None:
        bucket_name = settings.SUPABASE_BUCKET
    
    try:
        supabase = get_supabase_client()
        if not supabase:
            return None
        
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to get public URL from Supabase: {str(e)}")
        return None
