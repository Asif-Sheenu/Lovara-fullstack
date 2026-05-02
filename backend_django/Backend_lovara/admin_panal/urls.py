from django.urls import path
from .views import (
    ApproveStaffView,
    RejectStaffView,
    PendingStaffListView,
    ApprovedStaffListView,
    RejectedStaffListView
)

urlpatterns = [
    path("approve_staff/<int:user_id>/", ApproveStaffView.as_view()),
    path("reject_staff/<int:user_id>/", RejectStaffView.as_view()),

    path("staff/pending/", PendingStaffListView.as_view()),
    path("staff/approved/", ApprovedStaffListView.as_view()),
    path("staff/rejected/", RejectedStaffListView.as_view()),
]
