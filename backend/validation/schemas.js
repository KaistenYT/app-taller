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
    password: Joi.string().min(4).required().messages({
      "string.min": "La contraseña debe tener al menos 4 caracteres",
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
    client_idNumber: Joi.string().required().messages({
      "any.required": "El DNI/RUT del cliente es requerido",
    }),
    client_name: Joi.string().allow("", null),
    client_phone: Joi.string().allow("", null),

    device_id: Joi.number().integer().allow(null),
    device_serial: Joi.string().allow("", null),
    defect: Joi.string().required().messages({
      "any.required": "La falla/defecto es requerida",
    }),
    
    // Campos de dispositivo para creación on-the-fly
    device: Joi.object({
      serial_number: Joi.string().required(),
      description: Joi.string().allow("", null),
      features: Joi.string().allow("", null),
    }).optional(),

    // Campos opcionales con valores por defecto
    status: Joi.string().valid("PENDIENTE", "EN_REVISION", "PRESUPUESTADO", "APROBADO", "RECHAZADO", "EN_REPARACION", "FINALIZADO", "RETIRADO").default("PENDIENTE"),
    repair: Joi.string().allow("", null),
    device_snapshot: Joi.object().optional(),
    created_at: Joi.string().isoDate().optional(),
    archived: Joi.boolean().default(false),
    company_id: Joi.number().integer().required(),
  }),

  update: Joi.object({
    client_idNumber: Joi.string(),
    client_name: Joi.string().allow("", null),
    client_phone: Joi.string().allow("", null),
    device_id: Joi.number().integer(),
    defect: Joi.string(),
    status: Joi.string().valid("PENDIENTE", "EN_REVISION", "PRESUPUESTADO", "APROBADO", "RECHAZADO", "EN_REPARACION", "FINALIZADO", "RETIRADO"),
    repair: Joi.string().allow("", null),
    device_snapshot: Joi.alternatives()
      .try(Joi.object(), Joi.string())
      .allow(null),
    // No permitir company_id en la actualización para evitar que una recepción se mueva entre empresas
  }),
};

export const deviceSchema = {
  create: Joi.object({
    serial_number: Joi.string().required().messages({
      "any.required": "El número de serie es requerido",
    }),
    description: Joi.string().required().messages({
      "any.required": "La descripción del equipo es requerida",
    }),
    features: Joi.string().allow("", null),
    company_id: Joi.number().integer().required(),
  }),
  
  update: Joi.object({
    serial_number: Joi.string(),
    description: Joi.string(),
    features: Joi.string().allow("", null),
    // No se permite cambiar company_id
  }),
};
