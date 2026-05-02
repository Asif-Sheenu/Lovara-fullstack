from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from .models import VendorWorks, WorkImages, Favorites, Review
from .serializers import VendorWorkSerializer, WorkImageSerializer, FavoritesSerializer, ReviewSerializer
from permissions.role_permissions  import IsStaff
# Create your views here.

class CreateVendorWork(APIView):
    permission_classes= [IsAuthenticated]

    def post (self,request):
        serializer = VendorWorkSerializer(data = request.data)

        if serializer.is_valid():
            serializer.save(vendor= request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class WorkImagesView(APIView):

    permission_classes= [IsAuthenticated]

    def post (self,request, work_id ):
        work = get_object_or_404(VendorWorks, id=work_id, vendor=request.user)
        images = request.FILES.getlist('images')
        image_objects = []

        for image in images:
            image_obj = WorkImages.objects.create(work=work,image_url=image)
            image_objects.append(image_obj)

        serializer= WorkImageSerializer(image_objects,many = True)
        return Response (serializer.data, status=status.HTTP_201_CREATED)    



class ListWorks (APIView):

    def get (self,request):
        work = VendorWorks.objects.prefetch_related("images","reviews","favorites").all()
        serializer=  VendorWorkSerializer(work,many = True)
        return Response(serializer.data)


class ToggleFavorite(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, work_id):

        work = get_object_or_404(VendorWorks, id=work_id)

        favorite = Favorites.objects.filter(user=request.user,work=work)

        if favorite.exists():
            favorite.delete()
            return Response({"message": "Removed from favorites"})

        Favorites.objects.create(user=request.user,work=work)

        return Response({"message": "Added to favorites"})        


class WorkDetailView(APIView):

    def get(self, request, work_id):
        work = get_object_or_404(VendorWorks, id=work_id)
        serializer = VendorWorkSerializer(work)
        return Response(serializer.data)

class AddReview(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, work_id):

        work = get_object_or_404(VendorWorks, id=work_id)

        serializer = ReviewSerializer(data=request.data)

        if serializer.is_valid():

            serializer.save(
                user=request.user,
                work=work
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)        


class WorkReviews(APIView):

    def get(self, request, work_id):

        reviews = Review.objects.filter(work_id=work_id)

        serializer = ReviewSerializer(reviews, many=True)

        return Response(serializer.data)       



class VendorWorksList(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        works = VendorWorks.objects.filter(vendor=request.user).prefetch_related(
            "images",
            "reviews",
            "favorites"
        )

        serializer = VendorWorkSerializer(works, many=True)

        return Response(serializer.data)        

class VendorWorksByVendor(APIView):

    def get(self, request, vendor_id):

        works = VendorWorks.objects.filter(vendor_id=vendor_id)

        serializer = VendorWorkSerializer(works, many=True)

        return Response(serializer.data)

class DeleteVendorWork(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    def delete(self, request, work_id):
        work = get_object_or_404(VendorWorks, id=work_id, vendor=request.user)
        work.delete()  # CloudinaryField auto-deletes images if you configure it
        return Response({"message": "Work deleted."}, status=status.HTTP_204_NO_CONTENT)


class DeleteWorkImage(APIView):
    permission_classes = [IsAuthenticated, IsStaff]

    def delete(self, request, work_id, image_id):
        work = get_object_or_404(VendorWorks, id=work_id, vendor=request.user)
        image = get_object_or_404(WorkImages, id=image_id, work=work)
        image.delete()  # CloudinaryField handles cloudinary deletion
        return Response({"message": "Image deleted."}, status=status.HTTP_204_NO_CONTENT)


class DeleteReview(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, review_id):
        review = get_object_or_404(Review, id=review_id, user=request.user)
        review.delete()
        return Response({"message": "Review deleted."}, status=status.HTTP_204_NO_CONTENT)        

class UpdateVendorWork(APIView):
    def patch(self, request, work_id):
        try:
            work = VendorWorks.objects.get(id=work_id, vendor=request.user)
        except VendorWorks.DoesNotExist:
            return Response({"error": "Work not found"}, status=404)

        serializer = VendorWorkSerializer(work, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

# avg  rating             

class AvgRating(APIView):
    def get (self, request, work_id):

        work = get_object_or_404(VendorWorks ,id = work_id)
        rating = Review.objects.filter (work= work).aggregate(avg_rating= Avg('rating'))
        return Response({
            "vendor_id":work.vendor.id,
            "average_rating":rating["avg_rating"]
        })