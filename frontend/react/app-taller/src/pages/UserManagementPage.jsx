import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listUsers,
  registerUser,
  updateUser,
  resetUserPassword,
  deleteUser,
} from "../api/httpApi";
import { getFriendlyErrorMessage } from "../utils/helpers";
import ConfirmModal from "../components/shared/ConfirmModal";
import Toast from "../components/shared/Toast";
import {
  Users,
  UserPlus,
  RotateCw,
  Pencil,
  Key,
  Trash2,
  ShieldCheck,
  User as UserIcon,
  Shield,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import { cn } from "../utils/cn";

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
    if (e) e.preventDefault();
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
    if (e) e.preventDefault();
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
    if (e) e.preventDefault();
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
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground mt-1">
            Administra las cuentas y permisos del personal del taller.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4"
            onClick={fetchUsers}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
          <Button
            className="rounded-full px-6 shadow-lg shadow-primary/20"
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
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden glass-card">
        <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Directorio de Personal
            </div>
            <Badge
              variant="outline"
              className="font-mono text-[10px] py-0 px-2"
            >
              {users.length} Registros
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border/50">
                  <TableHead className="w-[80px] text-center font-bold uppercase tracking-widest text-[10px]">
                    ID
                  </TableHead>
                  <TableHead className="font-bold uppercase tracking-widest text-[10px]">
                    Usuario
                  </TableHead>
                  <TableHead className="font-bold uppercase tracking-widest text-[10px]">
                    Rol / Permisos
                  </TableHead>
                  <TableHead className="text-right font-bold uppercase tracking-widest text-[10px] px-6">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <div className="h-8 bg-muted/40 rounded animate-pulse w-full"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-muted-foreground italic"
                    >
                      No hay usuarios registrados en el sistema.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow
                      key={u.id}
                      className="hover:bg-muted/30 transition-colors border-b border-border/40 group"
                    >
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {u.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-xs font-bold text-primary">
                              {u.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-bold text-sm tracking-tight">
                            {u.username}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-2 py-0 h-6 text-[10px] font-bold uppercase tracking-tighter border",
                            u.role === "admin"
                              ? "bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-900"
                              : "bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-900",
                          )}
                        >
                          {u.role === "admin" ? (
                            <>
                              <Shield className="mr-1 h-3 w-3" /> Administrador
                            </>
                          ) : (
                            <>
                              <UserIcon className="mr-1 h-3 w-3" /> Usuario
                              Estándar
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
                            onClick={() => openEditModal(u)}
                            title="Editar Usuario"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                            onClick={() => openResetModal(u)}
                            title="Restablecer Contraseña"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => handleDelete(u)}
                            disabled={u.id === user.id}
                            title="Eliminar Usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modern Dialogs with Shadcn */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserPlus className="h-5 w-5 text-primary" />
              Nuevo Colaborador
            </DialogTitle>
            <DialogDescription>
              Crea una nueva cuenta de acceso para el personal del taller.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createAlert.message && (
              <div
                className={cn(
                  "p-3 rounded-lg flex items-center gap-3 text-sm animate-in-fade",
                  createAlert.type === "danger"
                    ? "bg-red-500/10 text-red-600 border border-red-200"
                    : "bg-blue-500/10 text-blue-600",
                )}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {createAlert.message}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Nombre de Usuario
                </label>
                <Input
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, username: e.target.value })
                  }
                  className="bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="ej: jsmith"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                    className="bg-muted/30 border-transparent focus:bg-background transition-all"
                    placeholder="••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                    Confirmar
                  </label>
                  <Input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="bg-muted/30 border-transparent focus:bg-background transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Rol Asignado
                </label>
                <select
                  className="w-full h-10 rounded-md border border-transparent bg-muted/30 px-3 py-2 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, role: e.target.value })
                  }
                >
                  <option value="user">Usuario Estándar</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-lg"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-lg px-8 shadow-lg shadow-primary/20"
              onClick={handleCreate}
              disabled={createLoading}
            >
              {createLoading ? (
                <RotateCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              Actualiza el nombre de acceso o el nivel de permisos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editAlert.message && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-600 border border-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {editAlert.message}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Nombre de Usuario
                </label>
                <Input
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="bg-muted/30 border-transparent focus:bg-background transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Rol del Sistema
                </label>
                <select
                  className="w-full h-10 rounded-md border border-transparent bg-muted/30 px-3 py-2 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              Volver
            </Button>
            <Button
              className="shadow-lg shadow-primary/20"
              onClick={handleEdit}
              disabled={editLoading}
            >
              {editLoading ? (
                <RotateCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Key className="h-5 w-5 text-amber-500" />
              Seguridad: {resetForm.username}
            </DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña de acceso para esta cuenta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {resetAlert.message && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-600 border border-red-200 text-sm">
                {resetAlert.message}
              </div>
            )}
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Nueva Contraseña
                </label>
                <Input
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, newPassword: e.target.value })
                  }
                  className="bg-muted/30 border-transparent focus:bg-background transition-all"
                  placeholder="Mínimo 4 caracteres"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Confirmar Contraseña
                </label>
                <Input
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) =>
                    setResetForm({
                      ...resetForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="bg-muted/30 border-transparent focus:bg-background transition-all"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowResetModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="default"
              className="bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-lg shadow-amber-500/20"
              onClick={handleResetPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <RotateCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Restablecer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
