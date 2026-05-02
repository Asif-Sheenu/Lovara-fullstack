from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .rag_engine import search
from rest_framework import status

# Create your views here.


class AIsearchview(APIView):
    def post (sef,request):
        query = request.data.get('query')

        if not query:
            return Response(
                {"error": "Query is required"},status=status.HTTP_400_BAD_REQUEST
            )
        results= search (query)
        return Response(results, status.HTTP_200_OK)