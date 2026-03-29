import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  getBudgetDashboard, 
  listBudgetsFinancial, 
  updateBudgetPayment 
} from '../../api/httpApi';
import { formatCurrency } from '../../utils/helpers';
import Toast from '../shared/Toast';

export function BudgetDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [filters, setFilters] = useState({
    payment_status: 'all',
    dateFrom: '',
    dateTo: '',
  });
  
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_status: '',
    paid_amount: '',
    reason: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const apiFilters = {
        ...filters,
        payment_status: filters.payment_status === 'all' ? undefined : filters.payment_status
      };

      const [dashboardData, budgetsData] = await Promise.all([
        getBudgetDashboard({ dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
        listBudgetsFinancial(apiFilters)
      ]);

      setDashboard(dashboardData);
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Error loading financial data:', error);
      showToast('Error al cargar datos financieros', 'danger');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdatePayment = async () => {
    try {
      await updateBudgetPayment({
        id: selectedBudget.id,
        data: {
          payment_status: paymentData.payment_status,
          paid_amount: parseFloat(paymentData.paid_amount) || 0,
          reason: paymentData.reason,
        }
      });
      setPaymentDialogOpen(false);
      loadData();
      showToast('Pago actualizado correctamente');
    } catch (error) {
      showToast(error.message || 'Error al actualizar pago', 'danger');
    }
  };

  const openPaymentDialog = (budget) => {
    setSelectedBudget(budget);
    setPaymentData({
      payment_status: budget.payment_status,
      paid_amount: budget.paid_amount?.toString() || '',
      reason: '',
    });
    setPaymentDialogOpen(true);
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      PENDIENTE: 'secondary',
      PARCIAL: 'warning',
      PAGADO: 'success',
    };
    
    const icons = {
      PENDIENTE: <Clock className="w-3 h-3 mr-1" />,
      PARCIAL: <AlertCircle className="w-3 h-3 mr-1" />,
      PAGADO: <CheckCircle2 className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, message: '' })} 
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h2>
        <Button onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Aprobado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aprobado</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboard?.amounts?.total_approved)}</div>
            <div className="text-lg font-semibold text-primary">
              {dashboard?.counts?.approved ?? 0} presupuestos
            </div>
            <p className="text-xs text-muted-foreground">Aprobados</p>
          </CardContent>
        </Card>

        {/* Total Pagado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboard?.amounts?.total_paid)}
            </div>
            <div className="text-lg font-semibold text-green-700">
              {dashboard?.counts?.paid ?? 0} presupuestos
            </div>
            <p className="text-xs text-muted-foreground">Pagados</p>
          </CardContent>
        </Card>

        {/* Pendiente de Cobro */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
            <TrendingDown className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(dashboard?.amounts?.pending_to_collect)}
            </div>
            <div className="text-lg font-semibold text-orange-700">
              {(dashboard?.counts?.approved || 0) - (dashboard?.counts?.paid || 0)} presupuestos
            </div>
            <p className="text-xs text-muted-foreground">Pendientes de cobro</p>
          </CardContent>
        </Card>

        {/* Pendientes de Pago */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Pago</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(dashboard?.payment_breakdown?.pending?.amount)}
            </div>
            <div className="text-lg font-semibold text-yellow-700">
              {dashboard?.counts?.pending_payment ?? 0} presupuestos
            </div>
            <p className="text-xs text-muted-foreground">Sin pagar</p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose de Pagos */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cantidad:</span>
                <span className="font-medium">{dashboard?.payment_breakdown?.pending?.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monto Total:</span>
                <span className="font-medium">{formatCurrency(dashboard?.payment_breakdown?.pending?.amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parciales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Pagos Parciales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cantidad:</span>
                <span className="font-medium">{dashboard?.payment_breakdown?.partial?.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pagado:</span>
                <span className="font-medium text-green-600">{formatCurrency(dashboard?.payment_breakdown?.partial?.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pendiente:</span>
                <span className="font-medium text-orange-600">{formatCurrency(dashboard?.payment_breakdown?.partial?.pending)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Completamente Pagados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cantidad:</span>
                <span className="font-medium">{dashboard?.payment_breakdown?.paid?.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monto Total:</span>
                <span className="font-medium text-green-600">{formatCurrency(dashboard?.payment_breakdown?.paid?.amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Estado de Pago</Label>
              <Select
                value={filters.payment_status}
                onValueChange={(value) => setFilters({ ...filters, payment_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="PARCIAL">Parcial</SelectItem>
                  <SelectItem value="PAGADO">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Desde</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label>Hasta</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Presupuestos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Recepción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{budget.client_name}</div>
                      <div className="text-xs text-muted-foreground">{budget.client_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="truncate max-w-[200px]">{budget.reception_defect}</div>
                      <Badge variant="outline" className="mt-1">
                        {budget.reception_status}
                      </Badge>
                  </div>
                  </TableCell>
                  <TableCell>
                    {new Date(budget.created_at).toLocaleDateString('es-VE')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={budget.budget_status === 'APROBADO' ? 'success' : 'secondary'}>
                      {budget.budget_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPaymentStatusBadge(budget.payment_status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(budget.total_amount)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(budget.paid_amount)}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    {formatCurrency(budget.pending_amount)}
                  </TableCell>
                  <TableCell>
                    <Dialog open={paymentDialogOpen && selectedBudget?.id === budget.id} onOpenChange={setPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPaymentDialog(budget)}
                        >
                          Gestionar Pago
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Gestionar Pago - {budget.client_name}</DialogTitle>
                          <DialogDescription>
                            Actualiza el estado de pago y el monto abonado para este presupuesto.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Estado del Pago</Label>
                            <Select
                              value={paymentData.payment_status}
                              onValueChange={(value) => setPaymentData({ ...paymentData, payment_status: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                <SelectItem value="PARCIAL">Parcial</SelectItem>
                                <SelectItem value="PAGADO">Pagado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Monto Pagado (USD)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={paymentData.paid_amount}
                              onChange={(e) => setPaymentData({ ...paymentData, paid_amount: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Motivo / Nota</Label>
                            <Input
                              placeholder="Ej: Pago inicial, abono, etc."
                              value={paymentData.reason}
                              onChange={(e) => setPaymentData({ ...paymentData, reason: e.target.value })}
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Presupuesto:</span>
                            <span className="font-medium">{formatCurrency(budget.total_amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Pendiente:</span>
                            <span className="font-medium text-orange-600">
                              {formatCurrency(budget.total_amount - (parseFloat(paymentData.paid_amount) || 0))}
                            </span>
                          </div>
                          <Button onClick={handleUpdatePayment} className="w-full">
                            Actualizar Pago
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {budgets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay presupuestos que mostrar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
