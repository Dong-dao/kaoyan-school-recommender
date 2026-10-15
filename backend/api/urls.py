from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health_check, name='health'),
    path('universities/', views.list_universities, name='universities'),
    path('universities/<int:university_id>/', views.university_detail, name='university_detail'),
    path('recommend/', views.recommend, name='recommend'),
    path('records/', views.query_records, name='query_records'),
]
