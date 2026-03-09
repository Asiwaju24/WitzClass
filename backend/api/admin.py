from django.contrib import admin
from .models import User, School, SchoolTeacher, Classroom, ClassroomStudent, Assignment, Submission, Notification
from django.contrib.auth.admin import UserAdmin

admin.site.register(User, UserAdmin)
admin.site.register(School)
admin.site.register(SchoolTeacher)
admin.site.register(Classroom)
admin.site.register(ClassroomStudent)
admin.site.register(Assignment)
admin.site.register(Submission)
admin.site.register(Notification)
