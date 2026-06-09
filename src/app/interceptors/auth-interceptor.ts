import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userJson = localStorage.getItem('usuarioLogado');

  if (!userJson) {
    return next(req);
  }

  const usuarioLogado = JSON.parse(userJson);
  const token = usuarioLogado.token;

  if (!token) {
    return next(req);
  }

  const requestComToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(requestComToken);
};
