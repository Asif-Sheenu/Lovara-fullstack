from django.urls import path
from .views import (
    CreateVendorWork,
    WorkImagesView,
    ListWorks,
    ToggleFavorite,
    AddReview,
    WorkReviews,
    VendorWorksList,
    DeleteReview,
    DeleteVendorWork,
    DeleteWorkImage,
    WorkDetailView,
    AvgRating,
    VendorWorksByVendor,
    UpdateVendorWork
)

urlpatterns = [

    path('vendor/work/', CreateVendorWork.as_view(), name='create-vendor-work'),
    path('vendor/my-works/', VendorWorksList.as_view(), name='vendor-works'),
    path('upload/<int:work_id>/images/', WorkImagesView.as_view(), name='upload-work-images'),

    path('works/', ListWorks.as_view(), name='list-works'),
    path('works/<int:work_id>/', WorkDetailView.as_view(), name='work-detail'),
    path('works/<int:work_id>/favorite/', ToggleFavorite.as_view(), name='toggle-favorite'),

    path('works/<int:work_id>/review/', AddReview.as_view(), name='add-review'),
    path('works/<int:work_id>/reviews/', WorkReviews.as_view(), name='work-reviews'),
    path('works/<int:work_id>/edit/', UpdateVendorWork.as_view(), name='edit-works'),

    path('vendor/work/<int:work_id>/delete/', DeleteVendorWork.as_view()),
    path('works/<int:work_id>/images/<int:image_id>/delete/', DeleteWorkImage.as_view()),
    path('reviews/<int:review_id>/delete/', DeleteReview.as_view()),
    path("vendor/<int:vendor_id>/works/", VendorWorksByVendor.as_view()),
    path ('avg_rating/<int:work_id>/', AvgRating.as_view()),
]