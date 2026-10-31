from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import CurrentUserView, UserPasswordChangeView, UserLogoutView, UserRegistrationView

app_name = "accounts"

urlpatterns = [
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path(
        "me/change-password/",
        UserPasswordChangeView.as_view(),
        name="change-password",
    ),
    path(
        "logout/",
        UserLogoutView.as_view(),
        name="logout",
    ),
]