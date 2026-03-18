import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-registro',
  standalone: false,
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      fecha_nacimiento: ['', Validators.required],
      direccion: ['', Validators.required],
      username: ['', Validators.required], 
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  registrar(): void {
  if (this.registroForm.valid) {
    const datosForm = this.registroForm.value;

    const datosPaciente = {
      usuario: {
        nombre: datosForm.nombre,
        apellido: datosForm.apellido,
        dni: datosForm.dni,
        email: datosForm.email,
        telefono: datosForm.telefono,
        username: datosForm.username,
        password: datosForm.password,
        tipo_usuario: 'paciente'
      },
      fecha_nacimiento: datosForm.fecha_nacimiento,
      direccion: datosForm.direccion
    };

    this.auth.registrar(datosPaciente).subscribe({
      next: (res) => {
        console.log('Paciente registrado correctamente', res);
        alert('Registro exitoso');
      },
      error: (err) => {
        console.error('Error al registrar paciente:', err);
        alert('Error al registrar paciente');
      }
    });
  }
}
}


