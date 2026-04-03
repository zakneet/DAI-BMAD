from rest_framework.permissions import BasePermission


class HasAllowedGroup(BasePermission):
    allowed_groups = []

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        user_groups = set(user.groups.values_list("name", flat=True))
        return bool(user_groups.intersection(set(self.allowed_groups)))


class IsAdminGroup(HasAllowedGroup):
    allowed_groups = ["ADMIN"]


class IsAnesthesistGroup(HasAllowedGroup):
    allowed_groups = ["ANESTHESIST", "ADMIN"]


class IsIADEGroup(HasAllowedGroup):
    allowed_groups = ["IADE", "ADMIN"]


class IsSSPIGroup(HasAllowedGroup):
    allowed_groups = ["SSPI", "ADMIN"]


class IsClinicalStaffGroup(HasAllowedGroup):
    allowed_groups = ["ANESTHESIST", "IADE", "SSPI", "ADMIN"]


class IsPerOpStaffGroup(HasAllowedGroup):
    allowed_groups = ["ANESTHESIST", "IADE", "ADMIN"]


class IsPostOpStaffGroup(HasAllowedGroup):
    allowed_groups = ["ANESTHESIST", "SSPI", "ADMIN"]