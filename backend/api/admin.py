from django.contrib import admin

from .models import University, Major, QueryRecord


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name', 'level', 'major_type', 'avg_score', 'admission_rate', 'location')
    search_fields = ('name', 'location')
    list_filter = ('level', 'major_type')


@admin.register(Major)
class MajorAdmin(admin.ModelAdmin):
    list_display = ('name', 'university', 'score_offset', 'is_hot')
    search_fields = ('name', 'university__name')


@admin.register(QueryRecord)
class QueryRecordAdmin(admin.ModelAdmin):
    list_display = ('undergraduate_school', 'target_major', 'total_score', 'created_at')
    readonly_fields = ('created_at',)
