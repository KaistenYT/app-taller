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
    status: Joi.string().default("PENDIENTE"),
    repair: Joi.string().allow("", null),
    device_snapshot: Joi.object().optional(),
    created_at: Joi.string().isoDate().optional(),
    archived: Joi.boolean().default(false),
    device: Joi.object({
      serial_number: Joi.string().required(),
      description: Joi.string().allow("", null),
      features: Joi.string().allow("", null),
    }).optional(),
  }).unknown(true),

  update: Joi.object({
    client_idNumber: Joi.string(),
    client_name: Joi.string().allow("", null),
    client_phone: Joi.string().allow("", null),
    device_id: Joi.number().integer(),
    defect: Joi.string(),
    status: Joi.string(),
    repair: Joi.string().allow("", null),
    device_snapshot: Joi.alternatives()
      .try(Joi.object(), Joi.string())
      .allow(null),
  }).unknown(true),
};
