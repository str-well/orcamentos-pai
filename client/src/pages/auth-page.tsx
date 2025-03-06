import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Lock, Building2, Wrench, LineChart, Shield, Calculator, Coins } from "lucide-react";
import { useForm } from "react-hook-form";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { z } from 'zod';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

interface LoginData {
  email: string;
  password: string;
}

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const { signIn } = useSupabaseAuth();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = async (data: LoginData) => {
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) throw error;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Seção Esquerda - Texto de Chamada */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <h1 className="text-5xl font-bold text-gray-900">
                  CotaHub
                </h1>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-medium text-gray-800">
                  O sistema ideal para gerenciar orçamentos com eficiência
                </h2>
                <p className="text-base text-gray-600 leading-relaxed max-w-xl">
                  Organize suas cotações, otimize seu fluxo de trabalho e aumente sua produtividade
                  <span className="inline-block animate-bounce ml-1">🚀</span>
                </p>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6 mt-10">
            <motion.div
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ x: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <Building2 className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">Gestão Centralizada</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Mantenha todos seus orçamentos organizados em um único lugar. Acesse facilmente histórico, status e detalhes de cada projeto.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ x: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <LineChart className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">Análise Detalhada</h3>
                <p className="text-sm text-gray-600 mt-0.5">Visualize métricas importantes, compare orçamentos e tome decisões baseadas em dados reais do seu negócio.</p>
              </div>
            </motion.div>

            <motion.div
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              whileHover={{ x: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <Wrench className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">Ferramentas Intuitivas</h3>
                <p className="text-sm text-gray-600 mt-0.5">Interface simplificada com recursos poderosos para criar, editar e gerenciar seus orçamentos de forma eficiente.</p>
              </div>
            </motion.div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Desenvolvido para profissionais que buscam excelência
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Criado por{" "}
                <a
                  href="https://www.linkedin.com/in/str-well/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-800 hover:text-primary font-medium flex items-center gap-1 transition-colors"
                >
                  Wellington Felix
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
                  </svg>
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Seção Direita - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 relative bg-gray-50">
        <div className="w-full max-w-md relative">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="border-2 backdrop-blur-sm bg-white/50 shadow-xl">
              <CardHeader className="space-y-2 pb-8">
                <motion.div variants={itemVariants}>
                  <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                    Bem-vindo de volta
                  </CardTitle>
                  <p className="text-center text-muted-foreground mt-2">
                    Acesse sua conta para gerenciar seus orçamentos
                  </p>
                </motion.div>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-6"
                >
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative group">
                      <Input
                        {...loginForm.register("email")}
                        type="email"
                        id="email"
                        className="pl-10 h-12 bg-white/70 backdrop-blur-sm border-2 transition-all focus:scale-[1.01]"
                        placeholder="Digite seu email"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative group">
                      <Input
                        {...loginForm.register("password")}
                        type="password"
                        id="password"
                        className="pl-10 h-12 bg-white/70 backdrop-blur-sm border-2 transition-all focus:scale-[1.01]"
                        placeholder="Digite sua senha"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className="w-full h-12 text-lg transition-all hover:scale-[1.02]"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : null}
                      Entrar no Sistema
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Precisa de ajuda? Entre em contato com nosso suporte
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
