import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeviceStore } from "../stores/deviceStore";
import { FormInput } from "../components/shared/FormInput";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Search, ArrowLeft, Monitor } from "lucide-react";
import Toast from "../components/shared/Toast";
import { getFriendlyErrorMessage } from "../utils/helpers";

export default function DeviceSearchPage() {
  const navigate = useNavigate();
  const { getDeviceBySerial } = useDeviceStore();
  const [serial, setSerial] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!serial.trim()) {
      showToast("Ingresa un número de serial", "danger");
      return;
    }

    setSearching(true);
    try {
      const device = await getDeviceBySerial(serial);
      if (device) {
        setSearchResult(device);
        showToast("Dispositivo encontrado");
      } else {
        setSearchResult(null);
        showToast("No se encontró dispositivo con ese serial", "danger");
      }
    } catch (error) {
      setSearchResult(null);
      showToast(getFriendlyErrorMessage(error), "danger");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-in-fade">
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
              Buscar por Serial
            </h2>
          </div>
          <p className="text-muted-foreground font-medium pl-3.5">
            Busca un dispositivo usando su número de serial
          </p>
        </div>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Búsqueda de Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-6">
            <FormInput
              label="Número de Serial"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="SN-XXXX-000"
              required
            />

            <Button type="submit" disabled={searching} className="w-full">
              <Search className="mr-2 h-4 w-4" />
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </form>

          {searchResult && (
            <div className="mt-8 p-6 border rounded-lg bg-muted/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Monitor className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-xl font-bold">
                      {searchResult.description}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      SN: {searchResult.serial_number}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/devices/${searchResult.id}`)}
                >
                  Ver Detalles
                </Button>
              </div>

              {searchResult.features && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Características
                  </p>
                  <p className="font-medium">{searchResult.features}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
