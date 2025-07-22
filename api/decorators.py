from functools import wraps
from django.shortcuts import redirect

def firebase_login_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if 'uid' not in request.session:
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper
