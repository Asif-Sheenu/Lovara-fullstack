from rest_framework import serializers
from .models import VendorWorks, Favorites, WorkImages, Review


class WorkImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = WorkImages
        fields = ['id', 'image_url']

    def get_image_url(self, obj):
        return obj.image_url.url if obj.image_url else None

class ReviewSerializer(serializers.ModelSerializer):

    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'rating', 'comment', 'created_at']


class VendorWorkSerializer(serializers.ModelSerializer):

    images = WorkImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)

    favorite_count = serializers.SerializerMethodField()
    vendor_id = serializers.IntegerField(source="vendor.id", read_only=True)

    class Meta:
        model = VendorWorks
        fields = [
            'id',
            'vendor_id',
            'title',
            'description',
            'created_at',
            'images',
            'reviews',
            'favorite_count',
            'is_available'
        ]

    def get_favorite_count(self, obj):
        return obj.favorites.count()


class FavoritesSerializer(serializers.ModelSerializer):

    class Meta:
        model = Favorites
        fields = ['id', 'user', 'work', 'created_at']