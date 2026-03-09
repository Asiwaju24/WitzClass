from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import User, School, SchoolTeacher, Classroom, ClassroomStudent, Assignment, Submission, Notification
from .serializers import (
    UserSerializer, RegisterSerializer, SchoolSerializer,
    ClassroomSerializer, AssignmentSerializer, SubmissionSerializer,
    GradeSerializer, NotificationSerializer, SchoolTeacherSerializer
)


def notify(user, message):
    Notification.objects.create(user=user, message=message)
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'notifications_{user.id}',
            {'type': 'send_notification', 'message': message}
        )
    except Exception:
        pass


# ─── AUTH ────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=201)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── SCHOOL ──────────────────────────────────────────────────────────────────

class SchoolCreateView(generics.CreateAPIView):
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != 'school_admin':
            raise permissions.PermissionDenied('Only school admins can register a school.')
        if hasattr(self.request.user, 'school'):
            raise permissions.PermissionDenied('You already have a school registered.')
        serializer.save(admin=self.request.user)


class SchoolDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Admin can only access THEIR OWN school
        return get_object_or_404(School, admin=self.request.user)


class SchoolOverviewView(APIView):
    """School admin dashboard - only shows data belonging to the requesting admin's school"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Strictly scoped to the requesting user's school only
        school = get_object_or_404(School, admin=request.user)
        teachers = SchoolTeacher.objects.filter(school=school).select_related('teacher')
        classrooms = Classroom.objects.filter(school=school)
        total_students = sum(c.students.count() for c in classrooms)
        total_submissions = sum(
            Submission.objects.filter(assignment__classroom=c).count()
            for c in classrooms
        )
        return Response({
            'school': SchoolSerializer(school).data,
            'teacher_count': teachers.count(),
            'classroom_count': classrooms.count(),
            'student_count': total_students,
            'submission_count': total_submissions,
            'teachers': SchoolTeacherSerializer(teachers, many=True).data,
            'classrooms': ClassroomSerializer(classrooms, many=True).data,
        })


class JoinSchoolView(APIView):
    """Teacher joins a school using school code"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        if request.user.role not in ('teacher', 'independent_tutor'):
            return Response({'error': 'Only teachers can join a school.'}, status=400)
        school = get_object_or_404(School, code=code)
        membership, created = SchoolTeacher.objects.get_or_create(
            school=school, teacher=request.user,
            defaults={'subject': request.data.get('subject', '')}
        )
        if not created:
            return Response({'error': 'You are already a member of this school.'}, status=400)
        notify(school.admin, f"Teacher {request.user.get_full_name() or request.user.username} joined your school.")
        return Response({'message': f'Successfully joined {school.name}!', 'school': SchoolSerializer(school).data})


# ─── CLASSROOM ───────────────────────────────────────────────────────────────

class ClassroomListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('teacher', 'independent_tutor'):
            # Teachers only see their OWN classrooms
            return Classroom.objects.filter(teacher=user)
        if user.role == 'school_admin':
            # School admin only sees classrooms belonging to THEIR school
            school = get_object_or_404(School, admin=user)
            return Classroom.objects.filter(school=school)
        # Students only see classrooms they are enrolled in
        return Classroom.objects.filter(students__student=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ('teacher', 'independent_tutor'):
            raise permissions.PermissionDenied('Only teachers can create classrooms.')
        school = None
        if user.role == 'teacher':
            membership = SchoolTeacher.objects.filter(teacher=user).first()
            if membership:
                school = membership.school
        serializer.save(teacher=user, school=school)


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    SECURITY FIX: get_queryset now scopes classrooms to the requesting user only.
    A teacher from School A cannot access, edit, or delete a classroom from School B.
    """
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('teacher', 'independent_tutor'):
            # Teachers can only retrieve/update/delete their OWN classrooms
            return Classroom.objects.filter(teacher=user)
        if user.role == 'school_admin':
            # School admin can only access classrooms within THEIR school
            school = get_object_or_404(School, admin=user)
            return Classroom.objects.filter(school=school)
        # Students can only view classrooms they are enrolled in (read-only)
        return Classroom.objects.filter(students__student=user)


class JoinClassroomView(APIView):
    """Student joins classroom using join code"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        if request.user.role != 'student':
            return Response({'error': 'Only students can join classrooms.'}, status=400)
        classroom = get_object_or_404(Classroom, join_code=code, is_active=True)
        membership, created = ClassroomStudent.objects.get_or_create(
            classroom=classroom, student=request.user
        )
        if not created:
            return Response({'error': 'You are already in this classroom.'}, status=400)
        notify(classroom.teacher, f"🎒 {request.user.get_full_name() or request.user.username} joined your classroom '{classroom.name}'")
        return Response({'message': f'Successfully joined {classroom.name}!', 'classroom': ClassroomSerializer(classroom).data})


class ClassroomStudentsView(APIView):
    """
    SECURITY FIX: Only the classroom's teacher, the school admin of that school,
    or an enrolled student can view the student list. No outsider access.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        classroom = get_object_or_404(Classroom, pk=pk)
        user = request.user

        # Check if user is the classroom's teacher
        is_teacher = (user == classroom.teacher)

        # Check if user is the school admin of the school this classroom belongs to
        is_school_admin = (
            user.role == 'school_admin' and
            classroom.school is not None and
            hasattr(user, 'school') and
            classroom.school.admin == user
        )

        # Check if user is an enrolled student in this classroom
        is_enrolled_student = ClassroomStudent.objects.filter(
            classroom=classroom, student=user
        ).exists()

        if not (is_teacher or is_school_admin or is_enrolled_student):
            raise permissions.PermissionDenied(
                'You do not have permission to view students in this classroom.'
            )

        students = ClassroomStudent.objects.filter(classroom=classroom).select_related('student')
        return Response([{
            'id': m.student.id,
            'username': m.student.username,
            'full_name': m.student.get_full_name(),
            'email': m.student.email,
            'joined_at': m.joined_at,
        } for m in students])


# ─── ASSIGNMENTS ─────────────────────────────────────────────────────────────

class AssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        classroom_id = self.kwargs['classroom_id']
        user = self.request.user

        # Verify the user actually belongs to this classroom before listing assignments
        if user.role in ('teacher', 'independent_tutor'):
            classroom = get_object_or_404(Classroom, id=classroom_id, teacher=user)
        elif user.role == 'school_admin':
            school = get_object_or_404(School, admin=user)
            classroom = get_object_or_404(Classroom, id=classroom_id, school=school)
        else:
            # Student must be enrolled in this classroom
            classroom = get_object_or_404(
                Classroom,
                id=classroom_id,
                students__student=user
            )

        return Assignment.objects.filter(classroom=classroom)

    def perform_create(self, serializer):
        classroom = get_object_or_404(Classroom, id=self.kwargs['classroom_id'])
        if self.request.user != classroom.teacher:
            raise permissions.PermissionDenied('Only the classroom teacher can post assignments.')
        assignment = serializer.save(classroom=classroom)
        for membership in classroom.students.all():
            notify(membership.student,
                   f"📝 New assignment '{assignment.title}' in {classroom.name}" +
                   (f" — due {assignment.due_date.strftime('%b %d, %Y %H:%M')}" if assignment.due_date else ""))


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    SECURITY FIX: get_queryset scopes assignments to the requesting user only.
    Teacher A cannot edit or delete Teacher B's assignments.
    Students can only read assignments from classrooms they are enrolled in.
    """
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('teacher', 'independent_tutor'):
            # Teachers can only access assignments in their OWN classrooms
            return Assignment.objects.filter(classroom__teacher=user)
        if user.role == 'school_admin':
            # School admin can only access assignments within their school's classrooms
            school = get_object_or_404(School, admin=user)
            return Assignment.objects.filter(classroom__school=school)
        # Students can only access assignments in classrooms they are enrolled in
        return Assignment.objects.filter(classroom__students__student=user)


class ToggleAssignmentView(APIView):
    """Teacher opens/closes an assignment manually"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        assignment = get_object_or_404(Assignment, pk=pk)
        # Only the classroom's own teacher can toggle the assignment
        if request.user != assignment.classroom.teacher:
            raise permissions.PermissionDenied(
                'Only the teacher of this classroom can open or close assignments.'
            )
        assignment.is_open = not assignment.is_open
        assignment.save()
        status_text = 'opened' if assignment.is_open else 'closed'
        return Response({'message': f'Assignment {status_text}.', 'is_open': assignment.is_open})


# ─── SUBMISSIONS ─────────────────────────────────────────────────────────────

class SubmissionListView(generics.ListAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        assignment = get_object_or_404(Assignment, id=self.kwargs['assignment_id'])
        user = self.request.user

        # Teacher of this classroom sees all submissions
        if user == assignment.classroom.teacher:
            return Submission.objects.filter(assignment=assignment).select_related('student')

        # School admin of the school this classroom belongs to sees all submissions
        if user.role == 'school_admin' and hasattr(user, 'school'):
            if assignment.classroom.school and assignment.classroom.school.admin == user:
                return Submission.objects.filter(assignment=assignment).select_related('student')

        # Students only see their OWN submission
        return Submission.objects.filter(assignment=assignment, student=user)


class SubmitAssignmentView(APIView):
    """Student submits an assignment"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, assignment_id):
        assignment = get_object_or_404(Assignment, id=assignment_id)

        if request.user.role != 'student':
            return Response({'error': 'Only students can submit assignments.'}, status=400)

        # Verify the student is actually enrolled in this assignment's classroom
        is_enrolled = ClassroomStudent.objects.filter(
            classroom=assignment.classroom,
            student=request.user
        ).exists()
        if not is_enrolled:
            return Response({'error': 'You are not enrolled in this classroom.'}, status=403)

        if not assignment.is_accepting:
            return Response({'error': 'This assignment is closed and no longer accepting submissions.'}, status=400)

        if Submission.objects.filter(assignment=assignment, student=request.user).exists():
            return Response({'error': 'You have already submitted this assignment.'}, status=400)

        # Determine if late
        is_late = False
        if assignment.has_deadline and assignment.due_date:
            is_late = timezone.now() > assignment.due_date

        submission = Submission.objects.create(
            assignment=assignment,
            student=request.user,
            text_content=request.data.get('text_content', ''),
            note=request.data.get('note', ''),
            file=request.FILES.get('file'),
            image=request.FILES.get('image'),
            status='late' if is_late else 'submitted',
        )

        late_tag = ' ⚠️ (Late)' if is_late else ''
        notify(assignment.classroom.teacher,
               f"✅ {request.user.get_full_name() or request.user.username} submitted '{assignment.title}'{late_tag}")

        return Response(SubmissionSerializer(submission).data, status=201)


class GradeSubmissionView(APIView):
    """Teacher grades a submission"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        submission = get_object_or_404(Submission, pk=pk)

        # Only the teacher of the classroom this submission belongs to can grade it
        if request.user != submission.assignment.classroom.teacher:
            raise permissions.PermissionDenied(
                'Only the teacher of this classroom can grade submissions.'
            )

        s = GradeSerializer(submission, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        submission = s.save(status='graded', graded_at=timezone.now())

        notify(submission.student,
               f"🎯 Your submission for '{submission.assignment.title}' was graded: "
               f"{submission.score}/{submission.assignment.max_score} "
               f"({submission.percentage}% — {submission.letter_grade})")

        return Response(SubmissionSerializer(submission).data)


class NotSubmittedView(APIView):
    """Teacher sees who hasn't submitted yet"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, assignment_id):
        assignment = get_object_or_404(Assignment, id=assignment_id)

        # Only the classroom's own teacher can see who hasn't submitted
        if request.user != assignment.classroom.teacher:
            raise permissions.PermissionDenied(
                'Only the teacher of this classroom can view pending submissions.'
            )

        submitted_ids = assignment.submissions.values_list('student_id', flat=True)
        not_submitted = ClassroomStudent.objects.filter(
            classroom=assignment.classroom
        ).exclude(student_id__in=submitted_ids).select_related('student')

        return Response([{
            'id': m.student.id,
            'username': m.student.username,
            'full_name': m.student.get_full_name(),
            'email': m.student.email,
        } for m in not_submitted])


# ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users only ever see their OWN notifications
        return Notification.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_read(request):
    # Only marks the requesting user's own notifications as read
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All marked as read.'})
    
