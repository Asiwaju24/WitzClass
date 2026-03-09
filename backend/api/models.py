from django.contrib.auth.models import AbstractUser
from django.db import models
import random, string


def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


class User(AbstractUser):
    ROLE_CHOICES = (
        ('school_admin', 'School Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('independent_tutor', 'Independent Tutor'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class School(models.Model):
    name = models.CharField(max_length=200)
    admin = models.OneToOneField(User, on_delete=models.CASCADE, related_name='school')
    code = models.CharField(max_length=10, unique=True, blank=True)
    address = models.TextField(blank=True)
    logo = models.ImageField(upload_to='schools/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = 'SCH-' + generate_code(6)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SchoolTeacher(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='teachers')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='school_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    subject = models.CharField(max_length=100, blank=True)

    class Meta:
        unique_together = ('school', 'teacher')


class Classroom(models.Model):
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=100, blank=True)
    level = models.CharField(max_length=100, blank=True, help_text="e.g. Grade 10, JSS2, Year 3")
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classrooms')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classrooms', null=True, blank=True)
    join_code = models.CharField(max_length=10, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.join_code:
            self.join_code = 'WTZ-' + generate_code(5)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.join_code})"


class ClassroomStudent(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='students')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classroom_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('classroom', 'student')


class Assignment(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    description = models.TextField()
    instructions = models.TextField(blank=True)
    attachment = models.FileField(upload_to='assignment_files/', blank=True, null=True)
    max_score = models.IntegerField(default=100)

    # Deadline control
    has_deadline = models.BooleanField(default=True)
    due_date = models.DateTimeField(null=True, blank=True)
    allow_late = models.BooleanField(default=False)
    is_open = models.BooleanField(default=True)  # teacher manually closes

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    @property
    def is_accepting(self):
        from django.utils import timezone
        if not self.is_open:
            return False
        if self.has_deadline and self.due_date:
            if timezone.now() > self.due_date and not self.allow_late:
                return False
        return True


class Submission(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('late', 'Late'),
        ('graded', 'Graded'),
    )
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')

    # Multiple submission types
    text_content = models.TextField(blank=True)
    file = models.FileField(upload_to='submissions/', blank=True, null=True)
    image = models.ImageField(upload_to='submission_images/', blank=True, null=True)

    note = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='submitted')

    # Grading
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('assignment', 'student')

    @property
    def percentage(self):
        if self.score is not None and self.assignment.max_score:
            return round((self.score / self.assignment.max_score) * 100, 1)
        return None

    @property
    def letter_grade(self):
        p = self.percentage
        if p is None:
            return None
        if p >= 90: return 'A+'
        if p >= 80: return 'A'
        if p >= 75: return 'B+'
        if p >= 70: return 'B'
        if p >= 65: return 'C+'
        if p >= 60: return 'C'
        if p >= 50: return 'D'
        return 'F'


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
