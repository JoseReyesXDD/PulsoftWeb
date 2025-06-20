from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class CustomUser(AbstractUser):
    uid = models.CharField(max_length=128, unique=True, null=True, blank=True)
    # Otros campos que tengas en tu CustomUser

    # SOLUCIÓN: Añadir related_name a 'groups' y 'user_permissions'
    groups = models.ManyToManyField(
        Group,
        verbose_name=('groups'),
        blank=True,
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="custom_user_set", # <--- AÑADE ESTO
        related_query_name="custom_user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=('user permissions'),
        blank=True,
        help_text=('Specific permissions for this user.'),
        related_name="custom_user_permissions_set", # <--- AÑADE ESTO
        related_query_name="custom_user",
    )

    class Meta:
        verbose_name = 'CustomUser'
        verbose_name_plural = 'CustomUsers'

    def __str__(self):
        return self.email # O el campo que uses como identificador principal