import { Component } from '@angular/core';
import{ Usuario } from '../models/Usuario.model';

@Component({
  selector: 'app-usuario',
  imports: [],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css',
})
export class Usuariocomponent {
    novoUsuario: Usuario=  {

  nome: '',
  email: '',
  senha: '',


  };
}
