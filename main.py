"""
Main entry point for Gunicorn to serve our Django application.
"""
import os
from fitness_planner.wsgi import application

# Make the application available for Gunicorn
app = application