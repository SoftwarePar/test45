import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      reset();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Credenciales inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Iniciar Sesión</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@test.com"
              {...register("email")}
              className="w-full"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="admin123"
              {...register("password")}
              className="w-full"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gradient text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Iniciando sesión...
              </div>
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>
        
        <div className="pt-6 border-t text-center">
          <p className="text-sm text-gray-600">Admin demo: admin@test.com / admin123</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
