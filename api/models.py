from django.db import models

class FirebaseUser(models.Model):
    uid = models.CharField(max_length=100, unique=True)
    email = models.EmailField()
    user_type = models.CharField(max_length=20, choices=[('patient', 'Paciente'), ('caregiver', 'Cuidador')])

    def __str__(self):
        return f"{self.email} ({self.user_type})"

class CaregiverPatientLink(models.Model):
    caregiver = models.ForeignKey(FirebaseUser, on_delete=models.CASCADE, related_name='cuidados')
    patient = models.ForeignKey(FirebaseUser, on_delete=models.CASCADE, related_name='cuidadores')
    linked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.caregiver.email} cuida a {self.patient.email}"
