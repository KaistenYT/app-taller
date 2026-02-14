import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getClient,
  createClient,
  updateClient,
  getDeviceBySerial,
  upsertDeviceBySerial,
  createDevice,
  getDevice,
  getReception,
  createReception,
  updateReception,
} from "../api/electronApi";
import useDebounce from "../hooks/useDebounce";
import Toast from "../components/shared/Toast";
import { toLocalISOString } from "../utils/helpers";

export default function ReceptionFormPage() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const formRef = useRef(null);

  const isEdit = paramId && paramId !== "new";

  const [clientIdPrefix, setClientIdPrefix] = useState("V");
  const [clientIdNum, setClientIdNum] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientLocked, setClientLocked] = useState(false);

  const [deviceSerial, setDeviceSerial] = useState("");
  const [deviceDescription, setDeviceDescription] = useState("");
  const [deviceFeatures, setDeviceFeatures] = useState("");

  const [defect, setDefect] = useState("");
  const [status, setStatus] = useState("PENDIENTE");
  const [repair, setRepair] = useState("");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [formMessage, setFormMessage] = useState({ text: "", type: "" });

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  const getClientId = () => {
    const prefix = clientIdPrefix.trim();
    const num = clientIdNum.trim();
    return prefix && num ? `${prefix}${num}`.toUpperCase() : "";
  };

  // Busca cliente por cédula (debounced) para autocompletar nombre/teléfono
  const searchClient = useDebounce(async () => {
    const idNumber = getClientId();
    if (!idNumber || idNumber.length < 3) {
      setClientLocked(false);
      return;
    }
    try {
      const cliente = await getClient(idNumber);
      if (cliente) {
        setClientName(cliente.name || "");
        setClientPhone(cliente.phone || "");
        setClientLocked(true);
        showToast(`Cliente encontrado: ${cliente.name}`, "info");
      } else {
        setClientLocked(false);
        setClientName("");
        setClientPhone("");
      }
    } catch (err) {
      console.error("Error searching client:", err);
      setClientLocked(false);
    }
  }, 500);

  useEffect(() => {
    if (!isEdit) searchClient();
  }, [clientIdPrefix, clientIdNum]);

  // Carga datos existentes al editar una recepción
  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      setLoading(true);
      setFormMessage({
        text: "Cargando información de la recepción...",
        type: "info",
      });
      try {
        const rec = await getReception(paramId);
        if (!rec) throw new Error("Recepción no encontrada");

        if (rec.client_idNumber) {
          const prefix = rec.client_idNumber.charAt(0).toUpperCase();
          const num = rec.client_idNumber.substring(1);
          setClientIdPrefix(prefix);
          setClientIdNum(num);

          try {
            const cliente = await getClient(rec.client_idNumber);
            if (cliente) {
              setClientName(cliente.name || "");
              setClientPhone(cliente.phone || "");
              setClientLocked(true);
            }
          } catch {
            setClientLocked(false);
          }
        }

        let snapshot = rec.device_snapshot;
        if (typeof snapshot === "string") {
          try {
            snapshot = JSON.parse(snapshot);
          } catch {
            snapshot = null;
          }
        }

        if (snapshot) {
          setDeviceSerial(snapshot.serial_number || "");
          setDeviceDescription(snapshot.description || "");
          setDeviceFeatures(snapshot.features || "");
        } else if (rec.device_id) {
          try {
            const device = await getDevice(rec.device_id);
            if (device) {
              setDeviceSerial(device.serial_number || "");
              setDeviceDescription(device.description || "");
              setDeviceFeatures(device.features || "");
            }
          } catch {}
        }

        setDefect(rec.defect || "");
        setStatus(rec.status || "PENDIENTE");
        setRepair(rec.repair || "");

        setFormMessage({
          text: "Recepción cargada correctamente.",
          type: "success",
        });
      } catch (err) {
        setFormMessage({ text: `Error: ${err.message}`, type: "danger" });
      } finally {
        setLoading(false);
      }
    })();
  }, [paramId, isEdit]);

  function extractDeviceId(device) {
    if (!device) return null;
    return device.id || device.deviceId || device.device_id || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.classList.add("was-validated");
      return;
    }

    const clientId = getClientId();
    if (!clientId || !clientName.trim()) {
      setFormMessage({
        text: "Por favor, complete los datos del cliente",
        type: "warning",
      });
      return;
    }
    if (!deviceDescription.trim() || !defect.trim()) {
      setFormMessage({
        text: "Complete la descripción del equipo y el defecto reportado",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    setFormMessage({ text: "", type: "" });

    const clientData = {
      idNumber: clientId,
      name: clientName.trim(),
      phone: clientPhone.trim() || null,
    };
    const deviceData = {
      serial_number: deviceSerial.trim() || null,
      description: deviceDescription.trim(),
      features: deviceFeatures.trim() || null,
    };

    try {
      let cliente;
      try {
        cliente = await getClient(clientData.idNumber);
        if (cliente) {
          if (
            cliente.name !== clientData.name ||
            cliente.phone !== clientData.phone
          ) {
            cliente = await updateClient({
              ...cliente,
              name: clientData.name,
              phone: clientData.phone,
            });
          }
        } else {
          cliente = await createClient(clientData);
        }
      } catch (err) {
        throw new Error("No se pudo guardar la información del cliente.");
      }

      let equipo;
      try {
        if (deviceData.serial_number) {
          equipo = await upsertDeviceBySerial(deviceData);
        } else {
          equipo = await createDevice(deviceData);
        }
      } catch (err) {
        console.error("Device error:", err);
        equipo = null;
      }

      const device_id = extractDeviceId(equipo);
      if (!device_id) throw new Error("No se pudo obtener el ID del equipo");

      const snapshot = {
        id: device_id,
        serial_number:
          equipo?.serial_number || deviceData.serial_number || null,
        description: equipo?.description || deviceData.description || null,
        features: equipo?.features || deviceData.features || null,
        captured_at: toLocalISOString(),
      };

      const finalReception = {
        client_idNumber: cliente.idNumber,
        client_name: clientData.name,
        client_phone: clientData.phone,
        device_id,
        defect: defect.trim(),
        status: status || "PENDIENTE",
        repair: repair.trim() || null,
        device_snapshot: snapshot,
      };

      if (isEdit) {
        await updateReception(paramId, finalReception, user.id);
        showToast("Recepción actualizada correctamente");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        await createReception(finalReception, user.id);
        showToast("Recepción creada correctamente");
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (err) {
      let msg = err.message || "Error desconocido";
      if (msg.includes("UNIQUE constraint failed")) {
        if (msg.includes("client.idNumber"))
          msg = "Ya existe un cliente con esta cédula/RIF";
        else if (msg.includes("device.serial_number"))
          msg = "Ya existe un equipo con este número de serie";
      }
      setFormMessage({ text: msg, type: "danger" });
      showToast(msg, "danger");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  function handlePhoneInput(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length >= 4) {
      const formatted =
        digits.length >= 7
          ? `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
          : `${digits.slice(0, 4)}-${digits.slice(4)}`;
      setClientPhone(formatted);
    } else {
      setClientPhone(digits);
    }
  }

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i
            className={`bi ${isEdit ? "bi-pencil-square" : "bi-plus-circle"} me-2`}
          ></i>
          {isEdit ? `Editar Recepción #${paramId}` : "Nueva Recepción"}
        </h2>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/dashboard")}
        >
          <i className="bi bi-arrow-left me-1"></i>Volver
        </button>
      </div>

      {formMessage.text && (
        <div
          className={`alert alert-${formMessage.type} alert-dismissible fade show`}
        >
          {formMessage.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setFormMessage({ text: "", type: "" })}
          ></button>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="needs-validation"
      >
        {/* Cliente */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">
              <i className="bi bi-person-circle me-2"></i>Datos del Cliente
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-2">
                <label htmlFor="client_idNumber_prefix" className="form-label">
                  Tipo
                </label>
                <select
                  id="client_idNumber_prefix"
                  className="form-select"
                  value={clientIdPrefix}
                  onChange={(e) => setClientIdPrefix(e.target.value)}
                  disabled={isEdit}
                >
                  <option value="V">V</option>
                  <option value="E">E</option>
                  <option value="J">J</option>
                  <option value="G">G</option>
                  <option value="P">P</option>
                </select>
              </div>
              <div className="col-md-4">
                <label htmlFor="client_idNumber_num" className="form-label">
                  Número de Cédula/RIF
                </label>
                <input
                  id="client_idNumber_num"
                  type="text"
                  className="form-control"
                  required
                  placeholder="12345678"
                  value={clientIdNum}
                  onChange={(e) => setClientIdNum(e.target.value)}
                  disabled={isEdit}
                />
                <div className="invalid-feedback">
                  Ingrese el número de cédula/RIF
                </div>
              </div>
              <div className="col-md-3">
                <label htmlFor="client_name" className="form-label">
                  Nombre
                </label>
                <input
                  id="client_name"
                  type="text"
                  className="form-control"
                  required
                  placeholder="Nombre del cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={clientLocked}
                />
                <div className="invalid-feedback">
                  Ingrese el nombre del cliente
                </div>
                {clientLocked && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 mt-1"
                    onClick={() => setClientLocked(false)}
                  >
                    <i className="bi bi-unlock me-1"></i>Desbloquear
                  </button>
                )}
              </div>
              <div className="col-md-3">
                <label htmlFor="client_phone" className="form-label">
                  Teléfono
                </label>
                <input
                  id="client_phone"
                  type="text"
                  className="form-control"
                  placeholder="0414-123-4567"
                  value={clientPhone}
                  onChange={(e) => handlePhoneInput(e.target.value)}
                  disabled={clientLocked}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Equipo */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">
              <i className="bi bi-laptop me-2"></i>Datos del Equipo
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label htmlFor="device_serial_number" className="form-label">
                  Número de Serie
                </label>
                <input
                  id="device_serial_number"
                  type="text"
                  className="form-control"
                  placeholder="Opcional"
                  value={deviceSerial}
                  onChange={(e) => setDeviceSerial(e.target.value)}
                />
              </div>
              <div className="col-md-8">
                <label htmlFor="device_description" className="form-label">
                  Descripción del Equipo
                </label>
                <input
                  id="device_description"
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ej: Laptop HP ProBook 450 G8"
                  value={deviceDescription}
                  onChange={(e) => setDeviceDescription(e.target.value)}
                />
                <div className="invalid-feedback">
                  Ingrese la descripción del equipo
                </div>
              </div>
              <div className="col-12">
                <label htmlFor="device_features" className="form-label">
                  Características
                </label>
                <textarea
                  id="device_features"
                  className="form-control"
                  rows="2"
                  placeholder="Ej: Intel i5, 8GB RAM, 256GB SSD"
                  value={deviceFeatures}
                  onChange={(e) => setDeviceFeatures(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Recepción */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">
              <i className="bi bi-clipboard-check me-2"></i>Detalles de la
              Recepción
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label htmlFor="defect" className="form-label">
                  Falla Reportada
                </label>
                <textarea
                  id="defect"
                  className="form-control"
                  rows="3"
                  required
                  placeholder="Describa la falla o problema reportado por el cliente"
                  value={defect}
                  onChange={(e) => setDefect(e.target.value)}
                ></textarea>
                <div className="invalid-feedback">
                  Ingrese la falla reportada
                </div>
              </div>
              <div className="col-md-6">
                <label htmlFor="status" className="form-label">
                  Estado
                </label>
                <select
                  id="status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROGRESO">En Progreso</option>
                  <option value="ESPERA_RESPUESTA">Esperando Respuesta</option>
                  <option value="TERMINADO">Terminado</option>
                  <option value="ENTREGADO">Entregado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
              <div className="col-12">
                <label htmlFor="repair" className="form-label">
                  Diagnóstico / Reparación
                </label>
                <textarea
                  id="repair"
                  className="form-control"
                  rows="3"
                  placeholder="Opcional – Describa el diagnóstico o la reparación realizada"
                  value={repair}
                  onChange={(e) => setRepair(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {isEdit ? "Actualizando..." : "Guardando..."}
              </>
            ) : (
              <>
                <i
                  className={`bi ${isEdit ? "bi-check-lg" : "bi-save"} me-1`}
                ></i>
                {isEdit ? "Actualizar Recepción" : "Guardar Recepción"}
              </>
            )}
          </button>
        </div>
      </form>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
