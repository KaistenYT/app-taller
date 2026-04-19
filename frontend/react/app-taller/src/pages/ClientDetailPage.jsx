import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useClientStore } from "../stores/clientStore";
import useReceptions from "../hooks/useReceptions";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, Package } from "lucide-react";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function ClientDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getClientById, loading } = useClientStore();
  const { receptions } = useReceptions((s) => ({
    receptions: s.receptions,
  }));

  const [client, setClient] = useState(null);

  useEffect(() => {
    const clientData = getClientById(parseInt(id));
    setClient(clientData);
  }, [id, getClientById]);

  const clientReceptions = receptions.filter(
    (r) => r.client_id === client?.id || r.client?.idNumber === client?.idNumber
  );

  if (loading || !client) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 animate-in-fade">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1.5 bg-primary rounded-full" />
              <h2 className="text-3xl font-extrabold tracking-tight">
                {client.name}
              </h2>
            </div>
            <p className="text-muted-foreground font-medium pl-3.5">
              ID: {client.idNumber}
            </p>
          </div>
        </div>

        <Button onClick={() => navigate(`/clients/${client.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{client.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Registrado el</p>
                <p className="font-medium">
                  {new Date(client.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {client.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Notas</p>
                <p className="font-medium">{client.notes}</p>
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
          {clientReceptions.length > 0 ? (
            <div className="space-y-3">
              {clientReceptions.map((reception) => (
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
                        {reception.device_snapshot?.description || "Equipo sin descripción"}
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
              Este cliente no tiene recepciones registradas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
