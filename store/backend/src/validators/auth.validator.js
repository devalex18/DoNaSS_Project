const { z } = require('zod');

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .email('Escribe un correo válido')
    .max(120, 'Máximo 120 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria')
    .max(72, 'Máximo 72 caracteres'),
}).strict();

module.exports = { loginSchema };