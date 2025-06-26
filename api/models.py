from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
import uuid # Necesario para generar tokens únicos

class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser de Django.
    Incluye un campo para el UID de Firebase para la sincronización y
    un campo para definir el tipo de usuario (Paciente o Cuidador).
    """
    uid = models.CharField(max_length=128, unique=True, null=True, blank=True, 
                           help_text="UID único del usuario en Firebase Authentication.")
    
    # Campo para distinguir el tipo de usuario (Paciente o Cuidador).
    # Esto es crucial para la lógica de negocio y permisos en la aplicación.
    USER_TYPE_CHOICES = (
        ('patient', 'Paciente'),
        ('caregiver', 'Cuidador'),
    )
    user_type = models.CharField(
        max_length=10, 
        choices=USER_TYPE_CHOICES, 
        default='patient', # Valor por defecto si no se especifica
        help_text="Define si el usuario es un paciente o un cuidador."
    )

    # Redefine groups y user_permissions para evitar conflictos con el modelo AbstractUser
    # cuando se utiliza un usuario personalizado. Esto es una buena práctica.
    groups = models.ManyToManyField(
        Group,
        verbose_name=('groups'),
        blank=True,
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="custom_user_set", # Nombre de relación inversa único
        related_query_name="custom_user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=('user permissions'),
        blank=True,
        help_text=('Specific permissions for this user.'),
        related_name="custom_user_permissions_set", # Nombre de relación inversa único
        related_query_name="custom_user",
    )

    class Meta:
        verbose_name = 'CustomUser'
        verbose_name_plural = 'CustomUsers'

    def __str__(self):
        """
        Representación en cadena del usuario, utilizando el email como identificador principal.
        """
        return self.email 

    def is_patient(self):
        """
        Método de conveniencia para verificar si el usuario es de tipo 'patient'.
        """
        return self.user_type == 'patient'

    def is_caregiver(self):
        """
        Método de conveniencia para verificar si el usuario es de tipo 'caregiver'.
        """
        return self.user_type == 'caregiver'


class Patient(models.Model):
    """
    Modelo de perfil específico para usuarios de tipo 'Paciente'.
    Contiene el token de enlace que un cuidador utilizará.
    """
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        primary_key=True, # Usa la PK de CustomUser como PK para este perfil
        related_name='patient_profile', # Nombre de la relación inversa para CustomUser
        limit_choices_to={'user_type': 'patient'} # Asegura que solo CustomUsers de tipo 'patient' puedan tener este perfil
    )
    # Token único que un paciente puede proporcionar a un cuidador para establecer un enlace.
    # Se genera automáticamente al guardar si no existe, asegurando unicidad.
    caregiver_link_token = models.CharField(
        max_length=36, # Longitud estándar para UUID (32 caracteres + 4 guiones)
        unique=True, 
        null=True, 
        blank=True, 
        help_text="Token único que un paciente proporciona a los cuidadores para vincularse."
    )

    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'

    def __str__(self):
        """
        Representación en cadena del paciente, mostrando el email del usuario asociado.
        """
        return f"Paciente: {self.user.email}"

    def save(self, *args, **kwargs):
        """
        Sobrescribe el método save para generar un token de enlace UUID si el campo está vacío.
        """
        if not self.caregiver_link_token:
            self.caregiver_link_token = str(uuid.uuid4()) # Genera un UUID v4
        super().save(*args, **kwargs)


class Caregiver(models.Model):
    """
    Modelo de perfil específico para usuarios de tipo 'Cuidador'.
    Gestiona la relación con los pacientes a los que cuida a través de un modelo intermedio.
    """
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        primary_key=True, # Usa la PK de CustomUser como PK para este perfil
        related_name='caregiver_profile', # Nombre de la relación inversa para CustomUser
        limit_choices_to={'user_type': 'caregiver'} # Asegura que solo CustomUsers de tipo 'caregiver' puedan tener este perfil
    )
    # Relación de muchos a muchos con Patient a través del modelo intermedio CaregiverPatientLink.
    # Esto permite que un cuidador tenga varios pacientes y un paciente varios cuidadores.
    patients = models.ManyToManyField(
        Patient, 
        through='CaregiverPatientLink', # Especifica el modelo intermedio
        related_name='caregivers', # Nombre de la relación inversa para Patient
        help_text="Los pacientes a los que este cuidador está vinculado."
    )

    class Meta:
        verbose_name = 'Cuidador'
        verbose_name_plural = 'Cuidadores'

    def __str__(self):
        """
        Representación en cadena del cuidador, mostrando el email del usuario asociado.
        """
        return f"Cuidador: {self.user.email}"


class CaregiverPatientLink(models.Model):
    """
    Modelo intermedio que define el enlace Many-to-Many entre Caregiver y Patient.
    Permite almacenar metadatos sobre cada enlace (ej. cuándo fue creado, si está activo).
    """
    caregiver = models.ForeignKey(
        Caregiver, 
        on_delete=models.CASCADE, 
        related_name='caregiver_links', # Relación inversa desde Caregiver
        help_text="El cuidador que establece el enlace."
    )
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='patient_links', # Relación inversa desde Patient
        help_text="El paciente con el que se establece el enlace."
    )
    linked_at = models.DateTimeField(
        auto_now_add=True, # Se establece automáticamente al crear el enlace
        help_text="Fecha y hora en que se estableció el enlace."
    )
    is_active = models.BooleanField(
        default=True, # Por defecto, un enlace es activo
        help_text="Indica si el enlace entre el cuidador y el paciente está activo."
    )

    class Meta:
        # Asegura que no se puedan crear enlaces duplicados entre el mismo cuidador y paciente.
        unique_together = ('caregiver', 'patient')
        verbose_name = 'Enlace Cuidador-Paciente'
        verbose_name_plural = 'Enlaces Cuidador-Paciente'

    def __str__(self):
        """
        Representación en cadena del enlace, mostrando los emails del cuidador y el paciente.
        """
        status_text = "Activo" if self.is_active else "Inactivo"
        return f"Enlace: {self.caregiver.user.email} con {self.patient.user.email} ({status_text})"


class ClinicalNote(models.Model):
    """
    Modelo para almacenar las notas clínicas o descripciones de episodios del paciente.
    Estas notas son la base para el análisis de la IA.
    """
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='clinical_notes', # Relación inversa desde Patient
        help_text="El paciente al que pertenece esta nota."
    )
    note_text = models.TextField(
        help_text="Contenido de la nota clínica o descripción del episodio."
    )
    created_at = models.DateTimeField(
        auto_now_add=True, # Se establece automáticamente al crear la nota
        help_text="Fecha y hora de creación de la nota."
    )

    class Meta:
        verbose_name = 'Nota Clínica'
        verbose_name_plural = 'Notas Clínicas'
        ordering = ['-created_at'] # Ordenar por las notas más recientes primero

    def __str__(self):
        """
        Representación en cadena de la nota, mostrando el paciente y un fragmento de la nota.
        """
        return f"Nota de {self.patient.user.email} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"


class AnxietyAnalysis(models.Model):
    """
    Modelo para almacenar los resultados del análisis de la IA para una nota clínica.
    """
    clinical_note = models.OneToOneField(
        ClinicalNote, 
        on_delete=models.CASCADE, 
        related_name='ai_analysis', # Relación inversa desde ClinicalNote
        help_text="La nota clínica a la que corresponde este análisis."
    )
    diagnosis = models.TextField(
        help_text="Diagnóstico o resumen del análisis generado por la IA."
    )
    suggestions = models.TextField(
        help_text="Sugerencias o recomendaciones generadas por la IA."
    )
    analyzed_at = models.DateTimeField(
        auto_now_add=True, # Se establece automáticamente al crear el análisis
        help_text="Fecha y hora en que se realizó el análisis."
    )

    class Meta:
        verbose_name = 'Análisis de Ansiedad (IA)'
        verbose_name_plural = 'Análisis de Ansiedad (IA)'
        ordering = ['-analyzed_at'] # Ordenar por los análisis más recientes primero

    def __str__(self):
        """
        Representación en cadena del análisis, mostrando el paciente de la nota asociada.
        """
        return f"Análisis de {self.clinical_note.patient.user.email} ({self.analyzed_at.strftime('%Y-%m-%d %H:%M')})"
