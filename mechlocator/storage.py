"""
Custom storage backends for Supabase integration
"""
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class SupabaseMediaStorage(S3Boto3Storage):
    """
    Custom storage backend for Supabase media files
    """
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    endpoint_url = settings.AWS_S3_ENDPOINT_URL
    region_name = settings.AWS_S3_REGION_NAME
    default_acl = settings.AWS_DEFAULT_ACL
    custom_domain = settings.AWS_S3_CUSTOM_DOMAIN
    object_parameters = settings.AWS_S3_OBJECT_PARAMETERS
    file_overwrite = False


class SupabaseStaticStorage(S3Boto3Storage):
    """
    Custom storage backend for Supabase static files
    """
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    endpoint_url = settings.AWS_S3_ENDPOINT_URL
    region_name = settings.AWS_S3_REGION_NAME
    default_acl = settings.AWS_DEFAULT_ACL
    custom_domain = settings.AWS_S3_CUSTOM_DOMAIN
    object_parameters = settings.AWS_S3_OBJECT_PARAMETERS
    file_overwrite = False
    location = 'static'
