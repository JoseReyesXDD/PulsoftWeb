from django import forms

class CambiarCorreoForm(forms.Form):
    nuevo_correo = forms.EmailField(label='Nuevo correo electrónico')

class CambiarContrasenaForm(forms.Form):
    nueva_contrasena = forms.CharField(label='Nueva contraseña', widget=forms.PasswordInput)
