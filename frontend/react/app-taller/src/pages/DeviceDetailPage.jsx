import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeviceStore } from "../stores/deviceStore";
import useReceptions from "../hooks/useReceptions";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Edit, Calendar, Package, Hash } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function DeviceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getDeviceById, loading } = useDeviceStore();
  const { receptions } = useReceptions((s) => ({
    receptions: s.receptions,
  }));

  const [device, setDevice] = useState(null);

  useEffect(() => {
    const deviceData = getDeviceById(parseInt(id));
    setDevice(deviceData);
  }, [id, getDeviceById]);

  const deviceReceptions = receptions.filter(
    (r) => r.device_id === device?.id || r.device?.serial_number === device?.serial_number
  );

  if (loading || !device) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/devices")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1.5 bg-primary rounded-full" />
              <h2 className="text-3xl font-extrabold tracking-tight">
                {device.description}
              </h2>
            </div>
            <p className="text-muted-foreground font-medium pl-3.5 font-mono">
              SN: {device.serial_number}
            </p>
          </div>
        </div>

        <Button onClick={() => navigate(`/devices/${device.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Dispositivo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Información del Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Hash className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Serial</p>
                <p className="font-mono font-medium">{device.serial_number}</p>
              </div>
            </div>
            {device.features && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Características</p>
                <p className="font-medium">{device.features}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Información de Registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Registrado el</p>
                <p className="font-medium">
                  {new Date(device.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {device.updated_at !== device.created_at && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Última actualización</p>
                  <p className="font-medium">
                    {new Date(device.updated_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Historial de Recepciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deviceReceptions.length > 0 ? (
            <div className="space-y-3">
              {deviceReceptions.map((reception) => (
                <div
                  key={reception.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/reception/${reception.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        Recepción #{reception.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reception.defect || "Sin descripción de falla"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(reception.created_at).toLocaleDateString("es-ES")}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {reception.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Este dispositivo no tiene recepciones registradas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
