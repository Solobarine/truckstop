# from django.shortcuts import render

from django.contrib.auth.models import Group, User
from rest_framework import permissions, viewsets
from app.serializer import UserSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from .serializer import TripInputSerializer
from .services.route_planner import plan_trip


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class TripPlannerAPIView(APIView):
    def post(self, request):
        serializer = TripInputSerializer(data=request.data)
        if serializer.is_valid():
            data = plan_trip(serializer.validated_data)
            if "error" in data:
                return Response(data, status=500)
            else:
                return Response(data, status=200)
        return Response(serializer.errors, status=400)
