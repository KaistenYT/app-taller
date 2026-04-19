//schemas de validacion
import Joi from "joi";

export const userSchema = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      "string.base": '"username" debe ser texto',
      "string.alphanum":
        '"username" solo puede contener caracteres alfanuméricos',
      "string.min": '"username" debe tener al menos 3 caracteres',
      "string.max": '"username" no puede exceder 30 caracteres',
      "any.required": '"username" es requerido',
    }),
    password: Joi.string().min(4).max(100).required().messages({
      "string.min": "La contraseña debe tener al menos 4 caracteres",
      "string.max": "La contraseña no puede exceder 100 caracteres",
      "any.required": "La contraseña es requerida",
    }),
    role: Joi.string().valid("user", "admin").default("user"),
  }),

  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    role: Joi.string().valid("user", "admin"),
  }),
};

export const receptionSchema = {
  create: Joi.object({
    client_idNumber: Joi.string().max(20).required().messages({
      "string.max": '"DNI/RUT" no puede exceder 20 caracteres',
      "any.required": "El DNI/RUT del cliente es requerido",
    }),
    client_name: Joi.string().max(100).allow("", null).messages({
      "string.max": '"Nombre" no puede exceder 100 caracteres',
    }),
    client_phone: Joi.string().max(20).allow("", null).messages({
      "string.max": '"Teléfono" no puede exceder 20 caracteres',
    }),
    client_email: Joi.string().email().max(255).allow("", null).messages({
      "string.email": '"Email" debe ser un correo válido',
      "string.max": '"Email" no puede exceder 255 caracteres',
    }),

    device_id: Joi.number().integer().allow(null),
    device_serial: Joi.string().max(50).allow("", null).messages({
      "string.max": '"Serial" no puede exceder 50 caracteres',
    }),
    device_description: Joi.string().max(255).allow("", null),
    device_features: Joi.string().allow("", null),

    defect: Joi.string().required().messages({
      "any.required": "La falla/defecto es requerida",
    }),
    observations: Joi.string().allow("", null),
    
    // Campos de dispositivo para creación on-the-fly
    device: Joi.object({
      serial_number: Joi.string().max(50).required().messages({
        "string.max": '"Serial" no puede exceder 50 caracteres',
      }),
      description: Joi.string().max(255).allow("", null),
      features: Joi.string().allow("", null),
    }).optional(),

    // Campos opcionales con valores por defecto
    status: Joi.string().valid("PENDIENTE", "EN_PROCESO", "EN_REPARACION", "REPARADO", "LISTO", "EN_REVISION", "PRESUPUESTADO", "APROBADO", "RECHAZADO", "FINALIZADO", "RETIRADO").default("PENDIENTE"),
    repair: Joi.string().allow("", null),
    device_snapshot: Joi.object().optional(),
    created_at: Joi.string().isoDate().optional(),
    archived: Joi.boolean().default(false),
  }),

  update: Joi.object({
    client_idNumber: Joi.string().max(20),
    client_name: Joi.string().max(100).allow("", null),
    client_phone: Joi.string().max(20).allow("", null),
    client_email: Joi.string().email().max(255).allow("", null),
    
    device_id: Joi.number().integer(),
    device_serial: Joi.string().max(50).allow("", null),
    device_description: Joi.string().max(255).allow("", null),
    device_features: Joi.string().allow("", null),

    defect: Joi.string(),
    status: Joi.string().valid("PENDIENTE", "EN_PROCESO", "EN_REPARACION", "REPARADO", "LISTO", "EN_REVISION", "PRESUPUESTADO", "APROBADO", "RECHAZADO", "FINALIZADO", "RETIRADO"),
    repair: Joi.string().allow("", null),
    observations: Joi.string().allow("", null),
    device_snapshot: Joi.alternatives()
      .try(Joi.object(), Joi.string())
      .allow(null),
    // No permitir company_id en la actualización para evitar que una recepción se mueva entre empresas
  }),
};

export const deviceSchema = {
  create: Joi.object({
    serial_number: Joi.string().max(50).required().messages({
      "string.max": '"Serial" no puede exceder 50 caracteres',
      "any.required": "El número de serie es requerido",
    }),
    description: Joi.string().max(255).required().messages({
      "string.max": '"Descripción" no puede exceder 255 caracteres',
      "any.required": "La descripción del equipo es requerida",
    }),
    features: Joi.string().allow("", null),
  }),
  
  update: Joi.object({
    serial_number: Joi.string().max(50),
    description: Joi.string().max(255),
    features: Joi.string().allow("", null),
    // No se permite cambiar company_id
  }),
};
