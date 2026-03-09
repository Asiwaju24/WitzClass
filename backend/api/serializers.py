from rest_framework import serializers
from django.utils import timezone
from .models import User, School, SchoolTeacher, Classroom, ClassroomStudent, Assignment, Submission, Notification


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'bio', 'avatar']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class SchoolSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    teacher_count = serializers.SerializerMethodField()
    classroom_count = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = ['id', 'name', 'code', 'address', 'logo', 'admin', 'teacher_count', 'classroom_count', 'created_at']
        read_only_fields = ['code', 'admin']

    def get_teacher_count(self, obj):
        return obj.teachers.count()

    def get_classroom_count(self, obj):
        return obj.classrooms.count()


class ClassroomSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()
    assignment_count = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = ['id', 'name', 'subject', 'level', 'description', 'teacher',
                  'school', 'school_name', 'join_code', 'is_active',
                  'student_count', 'assignment_count', 'created_at']
        read_only_fields = ['join_code', 'teacher']

    def get_student_count(self, obj):
        return obj.students.count()

    def get_assignment_count(self, obj):
        return obj.assignments.count()

    def get_school_name(self, obj):
        return obj.school.name if obj.school else None


class AssignmentSerializer(serializers.ModelSerializer):
    submission_count = serializers.SerializerMethodField()
    not_submitted = serializers.SerializerMethodField()
    is_accepting = serializers.ReadOnlyField()

    class Meta:
        model = Assignment
        fields = ['id', 'classroom', 'title', 'description', 'instructions',
                  'attachment', 'max_score', 'has_deadline', 'due_date',
                  'allow_late', 'is_open', 'is_accepting',
                  'submission_count', 'not_submitted', 'created_at']
        read_only_fields = ['classroom']

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def get_not_submitted(self, obj):
        total = obj.classroom.students.count()
        submitted = obj.submissions.count()
        return total - submitted


class SubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    percentage = serializers.ReadOnlyField()
    letter_grade = serializers.ReadOnlyField()

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'text_content', 'file', 'image',
                  'note', 'submitted_at', 'status', 'score', 'feedback',
                  'graded_at', 'percentage', 'letter_grade']
        read_only_fields = ['student', 'submitted_at', 'status', 'score', 'feedback', 'graded_at']


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['score', 'feedback']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class SchoolTeacherSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    class Meta:
        model = SchoolTeacher
        fields = '__all__'
