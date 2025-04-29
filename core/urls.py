from django.urls import path
from . import views

app_name = 'core'  # Namespace for URLs

urlpatterns = [
    path('', views.landing_page, name='landing_page'),
    path('generate-plan/', views.generate_plan_view, name='generate_plan'),
    path('download-pdf/', views.download_pdf, name='download_pdf'),
]
