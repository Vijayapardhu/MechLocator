from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from mechanics.models import Mechanic, MechanicGallery, Review, CustomerProfile
from django.core.files.base import ContentFile
import random
from decimal import Decimal


class Command(BaseCommand):
    help = 'Populate database with sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create sample users
        users_data = [
            {
                'username': 'john_doe',
                'email': 'john@example.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'password': 'password123'
            },
            {
                'username': 'jane_smith',
                'email': 'jane@example.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'password': 'password123'
            },
            {
                'username': 'mike_wilson',
                'email': 'mike@example.com',
                'first_name': 'Mike',
                'last_name': 'Wilson',
                'password': 'password123'
            },
            {
                'username': 'sarah_jones',
                'email': 'sarah@example.com',
                'first_name': 'Sarah',
                'last_name': 'Jones',
                'password': 'password123'
            },
            {
                'username': 'david_brown',
                'email': 'david@example.com',
                'first_name': 'David',
                'last_name': 'Brown',
                'password': 'password123'
            }
        ]
        
        created_users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name']
                }
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                # Create customer profile
                CustomerProfile.objects.create(
                    user=user,
                    phone=f'+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}',
                    address=f'{random.randint(100, 9999)} Main St, City, State {random.randint(10000, 99999)}',
                    is_verified=random.choice([True, False])
                )
                created_users.append(user)
                self.stdout.write(f'Created user: {user.username}')
        
        # Create sample mechanics
        mechanics_data = [
            {
                'name': 'AutoCare Plus',
                'address': '123 Main Street, New York, NY 10001',
                'latitude': Decimal('40.7128'),
                'longitude': Decimal('-74.0060'),
                'contact': '+1-555-0101',
                'rating': Decimal('4.5'),
                'working_hours': 'Mon-Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 4:00 PM\nSun: Closed',
                'is_active': True
            },
            {
                'name': 'Quick Fix Garage',
                'address': '456 Oak Avenue, Los Angeles, CA 90210',
                'latitude': Decimal('34.0522'),
                'longitude': Decimal('-118.2437'),
                'contact': '+1-555-0202',
                'rating': Decimal('4.2'),
                'working_hours': 'Mon-Sat: 7:00 AM - 7:00 PM\nSun: 10:00 AM - 4:00 PM',
                'is_active': True
            },
            {
                'name': 'Pro Mechanic Services',
                'address': '789 Pine Road, Chicago, IL 60601',
                'latitude': Decimal('41.8781'),
                'longitude': Decimal('-87.6298'),
                'contact': '+1-555-0303',
                'rating': Decimal('4.8'),
                'working_hours': 'Mon-Fri: 6:00 AM - 8:00 PM\nSat: 7:00 AM - 6:00 PM\nSun: 8:00 AM - 4:00 PM',
                'is_active': True
            },
            {
                'name': 'Family Auto Repair',
                'address': '321 Elm Street, Houston, TX 77001',
                'latitude': Decimal('29.7604'),
                'longitude': Decimal('-95.3698'),
                'contact': '+1-555-0404',
                'rating': Decimal('4.0'),
                'working_hours': 'Mon-Fri: 8:00 AM - 5:30 PM\nSat: 9:00 AM - 3:00 PM\nSun: Closed',
                'is_active': True
            },
            {
                'name': 'Express Auto Solutions',
                'address': '654 Maple Drive, Phoenix, AZ 85001',
                'latitude': Decimal('33.4484'),
                'longitude': Decimal('-112.0740'),
                'contact': '+1-555-0505',
                'rating': Decimal('4.6'),
                'working_hours': 'Mon-Fri: 7:30 AM - 6:00 PM\nSat: 8:00 AM - 5:00 PM\nSun: Closed',
                'is_active': True
            }
        ]
        
        created_mechanics = []
        for mechanic_data in mechanics_data:
            mechanic, created = Mechanic.objects.get_or_create(
                name=mechanic_data['name'],
                defaults=mechanic_data
            )
            if created:
                created_mechanics.append(mechanic)
                self.stdout.write(f'Created mechanic: {mechanic.name}')
        
        # Create sample reviews
        review_titles = [
            'Excellent Service!',
            'Great work, highly recommended',
            'Fast and reliable',
            'Professional and honest',
            'Best mechanic in town',
            'Quick turnaround time',
            'Fair pricing and quality work',
            'Very satisfied with the service',
            'Will definitely come back',
            'Outstanding customer service'
        ]
        
        review_comments = [
            'They fixed my car quickly and the price was very reasonable. The staff was friendly and professional.',
            'Great experience! The mechanic explained everything clearly and the work was done on time.',
            'I\'ve been coming here for years and they never disappoint. Honest and reliable service.',
            'Fast service and fair prices. They diagnosed the issue quickly and fixed it properly.',
            'Excellent customer service and quality work. I would definitely recommend this place.',
            'The mechanic was knowledgeable and took the time to explain what was wrong with my car.',
            'Very professional service. They completed the repair ahead of schedule.',
            'I was impressed with their attention to detail and the quality of their work.',
            'Great communication throughout the process. I felt confident leaving my car with them.',
            'The best auto repair shop I\'ve used. Honest, reliable, and reasonably priced.'
        ]
        
        for mechanic in created_mechanics:
            # Create 3-5 reviews per mechanic
            num_reviews = random.randint(3, 5)
            selected_users = random.sample(created_users, min(num_reviews, len(created_users)))
            
            for user in selected_users:
                review, created = Review.objects.get_or_create(
                    mechanic=mechanic,
                    customer=user,
                    defaults={
                        'rating': random.randint(3, 5),
                        'title': random.choice(review_titles),
                        'comment': random.choice(review_comments),
                        'is_verified': random.choice([True, False]),
                        'is_public': True
                    }
                )
                if created:
                    self.stdout.write(f'Created review by {user.username} for {mechanic.name}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created:\n'
                f'- {len(created_users)} users with customer profiles\n'
                f'- {len(created_mechanics)} mechanic shops\n'
                f'- {Review.objects.count()} reviews\n'
                f'\nSample login credentials:\n'
                f'Username: john_doe, Password: password123\n'
                f'Username: jane_smith, Password: password123\n'
                f'Username: mike_wilson, Password: password123\n'
                f'Username: sarah_jones, Password: password123\n'
                f'Username: david_brown, Password: password123'
            )
        )