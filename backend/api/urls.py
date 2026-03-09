from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/login/', TokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/me/', views.MeView.as_view()),

    # School
    path('school/register/', views.SchoolCreateView.as_view()),
    path('school/me/', views.SchoolDetailView.as_view()),
    path('school/overview/', views.SchoolOverviewView.as_view()),
    path('school/join/', views.JoinSchoolView.as_view()),

    # Classrooms
    path('classrooms/', views.ClassroomListCreateView.as_view()),
    path('classrooms/<int:pk>/', views.ClassroomDetailView.as_view()),
    path('classrooms/<int:pk>/students/', views.ClassroomStudentsView.as_view()),
    path('classrooms/join/', views.JoinClassroomView.as_view()),
    path('classrooms/<int:classroom_id>/assignments/', views.AssignmentListCreateView.as_view()),

    # Assignments
    path('assignments/<int:pk>/', views.AssignmentDetailView.as_view()),
    path('assignments/<int:pk>/toggle/', views.ToggleAssignmentView.as_view()),
    path('assignments/<int:assignment_id>/submissions/', views.SubmissionListView.as_view()),
    path('assignments/<int:assignment_id>/submit/', views.SubmitAssignmentView.as_view()),
    path('assignments/<int:assignment_id>/not-submitted/', views.NotSubmittedView.as_view()),

    # Submissions
    path('submissions/<int:pk>/grade/', views.GradeSubmissionView.as_view()),

    # Notifications
    path('notifications/', views.NotificationListView.as_view()),
    path('notifications/read/', views.mark_notifications_read),
]
