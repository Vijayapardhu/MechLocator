"""
Tests for the new image and feedback models.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from mechanics.models import Mechanic, MechanicImage, CustomerFeedback, FeedbackImage
from decimal import Decimal


class MechanicImageModelTest(TestCase):
    """Test cases for MechanicImage model."""
    
    def setUp(self):
        """Set up test data."""
        self.mechanic = Mechanic.objects.create(
            name="Test Mechanic",
            latitude=Decimal("40.712776"),
            longitude=Decimal("-74.005974"),
            address="123 Test St, New York, NY",
            contact="+1234567890",
            rating=Decimal("4.5"),
            working_hours="Mon-Fri: 9AM-6PM",
            is_active=True
        )
    
    def test_create_mechanic_image(self):
        """Test creating a mechanic image."""
        image = MechanicImage.objects.create(
            mechanic=self.mechanic,
            caption="Test Image",
            image_type="shop",
            is_primary=True
        )
        self.assertEqual(image.mechanic, self.mechanic)
        self.assertEqual(image.caption, "Test Image")
        self.assertEqual(image.image_type, "shop")
        self.assertTrue(image.is_primary)
    
    def test_mechanic_images_relation(self):
        """Test that mechanic can have multiple images."""
        MechanicImage.objects.create(
            mechanic=self.mechanic,
            caption="Image 1",
            image_type="shop",
            is_primary=True
        )
        MechanicImage.objects.create(
            mechanic=self.mechanic,
            caption="Image 2",
            image_type="mechanic",
            is_primary=False
        )
        
        self.assertEqual(self.mechanic.images.count(), 2)


class CustomerFeedbackModelTest(TestCase):
    """Test cases for CustomerFeedback model."""
    
    def setUp(self):
        """Set up test data."""
        self.mechanic = Mechanic.objects.create(
            name="Test Mechanic",
            latitude=Decimal("40.712776"),
            longitude=Decimal("-74.005974"),
            address="123 Test St, New York, NY",
            contact="+1234567890",
            rating=Decimal("4.5"),
            working_hours="Mon-Fri: 9AM-6PM",
            is_active=True
        )
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
    
    def test_create_customer_feedback(self):
        """Test creating customer feedback."""
        feedback = CustomerFeedback.objects.create(
            mechanic=self.mechanic,
            user=self.user,
            customer_name="John Doe",
            rating=Decimal("4.5"),
            comment="Great service!",
            is_approved=True
        )
        self.assertEqual(feedback.mechanic, self.mechanic)
        self.assertEqual(feedback.user, self.user)
        self.assertEqual(feedback.customer_name, "John Doe")
        self.assertEqual(feedback.rating, Decimal("4.5"))
        self.assertTrue(feedback.is_approved)
    
    def test_mechanic_feedbacks_relation(self):
        """Test that mechanic can have multiple feedbacks."""
        CustomerFeedback.objects.create(
            mechanic=self.mechanic,
            customer_name="John Doe",
            rating=Decimal("4.5"),
            comment="Great service!"
        )
        CustomerFeedback.objects.create(
            mechanic=self.mechanic,
            customer_name="Jane Smith",
            rating=Decimal("5.0"),
            comment="Excellent work!"
        )
        
        self.assertEqual(self.mechanic.feedbacks.count(), 2)


class FeedbackImageModelTest(TestCase):
    """Test cases for FeedbackImage model."""
    
    def setUp(self):
        """Set up test data."""
        self.mechanic = Mechanic.objects.create(
            name="Test Mechanic",
            latitude=Decimal("40.712776"),
            longitude=Decimal("-74.005974"),
            address="123 Test St, New York, NY",
            contact="+1234567890",
            rating=Decimal("4.5"),
            working_hours="Mon-Fri: 9AM-6PM",
            is_active=True
        )
        self.feedback = CustomerFeedback.objects.create(
            mechanic=self.mechanic,
            customer_name="John Doe",
            rating=Decimal("4.5"),
            comment="Great service!"
        )
    
    def test_create_feedback_image(self):
        """Test creating a feedback image."""
        image = FeedbackImage.objects.create(
            feedback=self.feedback,
            caption="Test Feedback Image"
        )
        self.assertEqual(image.feedback, self.feedback)
        self.assertEqual(image.caption, "Test Feedback Image")
    
    def test_feedback_images_relation(self):
        """Test that feedback can have multiple images."""
        FeedbackImage.objects.create(
            feedback=self.feedback,
            caption="Image 1"
        )
        FeedbackImage.objects.create(
            feedback=self.feedback,
            caption="Image 2"
        )
        
        self.assertEqual(self.feedback.images.count(), 2)
