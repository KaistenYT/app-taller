import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listUsers,
  registerUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "../api/electronApi";
import { getFriendlyErrorMessage } from "../utils/helpers";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toast from "../components/shared/Toast";

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createAlert, setCreateAlert] = useState({ message: "", type: "" });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    username: "",
    role: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editAlert, setEditAlert] = useState({ message: "", type: "" });

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetForm, setResetForm] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetAlert, setResetAlert] = useState({ message: "", type: "" });

  const [confirmState, setConfirmState] = useState({
    show: false,
    title: "",
    message: "",
    action: null,
  });

  const showToast = useCallback(
    (message, type = "success") => setToast({ message, type }),
    [],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listUsers({ user_role: user.role });
      setUsers(result || []);
    } catch (err) {
      showToast(getFriendlyErrorMessage(err), "danger");
    } finally {
      setLoading(false);
    }
  }, [user.role, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.username.trim() || !createForm.password) {
      setCreateAlert({
        message: "Usuario y contraseña son requeridos",
        type: "danger",
      });
      return;
    }
    if (createForm.password.length < 4) {
      setCreateAlert({
        message: "La contraseña debe tener al menos 4 caracteres",
        type: "danger",
      });
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setCreateAlert({
        message: "Las contraseñas no coinciden",
        type: "danger",
      });
      return;
    }
    setCreateLoading(true);
    try {
      await registerUser({
        username: createForm.username.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      showToast("Usuario creado correctamente");
      setShowCreateModal(false);
      await fetchUsers();
    } catch (err) {
      setCreateAlert({ message: getFriendlyErrorMessage(err), type: "danger" });
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editForm.username.trim()) {
      setEditAlert({
        message: "El nombre de usuario es requerido",
        type: "danger",
      });
      return;
    }
    setEditLoading(true);
    try {
      await updateUser({
        id: editForm.id,
        data: { username: editForm.username.trim(), role: editForm.role },
        user_role: user.role,
      });
      showToast("Usuario actualizado correctamente");
      setShowEditModal(false);
      await fetchUsers();
    } catch (err) {
      setEditAlert({ message: getFriendlyErrorMessage(err), type: "danger" });
    } finally {
      setEditLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (resetForm.newPassword.length < 4) {
      setResetAlert({
        message: "La contraseña debe tener al menos 4 caracteres",
        type: "danger",
      });
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetAlert({
        message: "Las contraseñas no coinciden",
        type: "danger",
      });
      return;
    }
    setResetLoading(true);
    try {
      await resetUserPassword({
        username: resetForm.username,
        newPassword: resetForm.newPassword,
        user_role: user.role,
      });
      showToast(`Contraseña de "${resetForm.username}" restablecida`);
      setShowResetModal(false);
    } catch (err) {
      setResetAlert({ message: getFriendlyErrorMessage(err), type: "danger" });
    } finally {
      setResetLoading(false);
    }
  }

  function handleDelete(targetUser) {
    setConfirmState({
      show: true,
      title: "Eliminar Usuario",
      message: `¿Estás seguro de eliminar al usuario "${targetUser.username}"? Esta acción no se puede deshacer.`,
      action: async () => {
        try {
          await deleteUser({
            id: targetUser.id,
            user_id: user.id,
            user_role: user.role,
          });
          showToast("Usuario eliminado");
          await fetchUsers();
        } catch (err) {
          showToast(getFriendlyErrorMessage(err), "danger");
        }
      },
    });
  }

  function openEditModal(u) {
    setEditForm({ id: u.id, username: u.username, role: u.role });
    setEditAlert({ message: "", type: "" });
    setShowEditModal(true);
  }

  function openResetModal(u) {
    setResetForm({
      username: u.username,
      newPassword: "",
      confirmPassword: "",
    });
    setResetAlert({ message: "", type: "" });
    setShowResetModal(true);
  }

  function handleConfirm() {
    if (confirmState.action) confirmState.action();
    setConfirmState({ show: false, title: "", message: "", action: null });
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-people me-2"></i>Gestión de Usuarios
          </h2>
          <span className="text-muted">
            Administración de cuentas del sistema
          </span>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={fetchUsers}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>Refrescar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setCreateForm({
                username: "",
                password: "",
                confirmPassword: "",
                role: "user",
              });
              setCreateAlert({ message: "", type: "" });
              setShowCreateModal(true);
            }}
          >
            <i className="bi bi-person-plus me-1"></i>Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-table me-2"></i>Usuarios
          </h5>
          <span className="text-muted small">
            {users.length > 0
              ? `${users.length} usuario${users.length !== 1 ? "s" : ""}`
              : ""}
          </span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Cargando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      <i className="bi bi-person-circle me-1"></i>
                      {u.username}
                    </td>
                    <td>
                      <span
                        className={`badge ${u.role === "admin" ? "bg-warning text-dark" : "bg-secondary"}`}
                      >
                        {u.role === "admin" ? "Administrador" : "Usuario"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          title="Editar"
                          onClick={() => openEditModal(u)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-warning"
                          title="Restablecer contraseña"
                          onClick={() => openResetModal(u)}
                        >
                          <i className="bi bi-key"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          title="Eliminar"
                          onClick={() => handleDelete(u)}
                          disabled={u.id === user.id}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Usuario */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>Nuevo Usuario
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  {createAlert.message && (
                    <div className={`alert alert-${createAlert.type} small`}>
                      {createAlert.message}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Nombre de Usuario</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.username}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          username: e.target.value,
                        })
                      }
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirmar Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={createForm.confirmPassword}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select
                      className="form-select"
                      value={createForm.role}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, role: e.target.value })
                      }
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createLoading}
                  >
                    {createLoading ? "Creando..." : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuario */}
      {showEditModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>Editar Usuario
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEdit}>
                <div className="modal-body">
                  {editAlert.message && (
                    <div className={`alert alert-${editAlert.type} small`}>
                      {editAlert.message}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Nombre de Usuario</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select
                      className="form-select"
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value })
                      }
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={editLoading}
                  >
                    {editLoading ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Restablecer Contraseña */}
      {showResetModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-key me-2"></i>Restablecer Contraseña —{" "}
                  {resetForm.username}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResetModal(false)}
                ></button>
              </div>
              <form onSubmit={handleResetPassword}>
                <div className="modal-body">
                  {resetAlert.message && (
                    <div className={`alert alert-${resetAlert.type} small`}>
                      {resetAlert.message}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Nueva Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={resetForm.newPassword}
                      onChange={(e) =>
                        setResetForm({
                          ...resetForm,
                          newPassword: e.target.value,
                        })
                      }
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirmar Contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      value={resetForm.confirmPassword}
                      onChange={(e) =>
                        setResetForm({
                          ...resetForm,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowResetModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Restableciendo..." : "Restablecer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={() =>
          setConfirmState({ show: false, title: "", message: "", action: null })
        }
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
