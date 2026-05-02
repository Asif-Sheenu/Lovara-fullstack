from django.urls import path
from .views import RegisterView,pending_vendors,Allusers,All_vendors,ApproveVendor,RejectVendor

urlpatterns=[
    path("register/", RegisterView.as_view(), name ="login"),
    path("pending-vendors/", pending_vendors.as_view(), name ="pending_ven"),
    # admin/
    path("all-vendors/", All_vendors.as_view(), name ="all_ven"),
    path("all_users/", Allusers.as_view(), name ="all_users"),
    path("approve_vendor/<int:user_id>/", ApproveVendor.as_view(), name ="approve_ vendor"),
    path("reject_vendor/<int:user_id>/", RejectVendor.as_view(), name ="reject_vendors")
]