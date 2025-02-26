import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Loader2, User, Lock, Building2, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { FieldValues } from "react-hook-form";

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

const floatingIconVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Defina a interface LoginData
interface LoginData {
  username: string;
  password: string;
}

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-primary/10">
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_90%)]" />

      <div className="container relative min-h-screen mx-auto flex items-center justify-center px-4">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">

          {/* Lado Esquerdo - Login/Registro */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md mx-auto"
          >
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login" className="text-lg">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="text-lg">Cadastrar</TabsTrigger>
              </TabsList>

              <div className="relative">
                <TabsContent value="login">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <Card className="border-2 backdrop-blur-sm bg-white/50">
                        <CardHeader className="space-y-2">
                          <motion.div variants={itemVariants}>
                            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                              Bem-vindo de volta
                            </CardTitle>
                          </motion.div>
                          <motion.p
                            variants={itemVariants}
                            className="text-muted-foreground text-center"
                          >
                            Entre com suas credenciais para continuar
                          </motion.p>
                        </CardHeader>
                        <CardContent>
                          <form
                            onSubmit={loginForm.handleSubmit((data) =>
                              loginMutation.mutate({
                                path: 'auth/v1/token',
                                data: {
                                  email: data.username,
                                  password: data.password,
                                  grant_type: 'password'
                                }
                              })
                            )}
                            className="space-y-6"
                          >
                            <motion.div variants={itemVariants} className="space-y-2">
                              <Label htmlFor="username" className="text-base">
                                Usuário
                              </Label>
                              <div className="relative group">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                <Input
                                  {...loginForm.register("username")}
                                  className="pl-10 h-12 transition-all border-2 group-hover:border-primary"
                                  placeholder="Digite seu usuário"
                                />
                              </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="space-y-2">
                              <Label htmlFor="password" className="text-base">
                                Senha
                              </Label>
                              <div className="relative group">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                <Input
                                  type="password"
                                  {...loginForm.register("password")}
                                  className="pl-10 h-12 transition-all border-2 group-hover:border-primary"
                                  placeholder="Digite sua senha"
                                />
                              </div>
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
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="register">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <Card className="border-2 backdrop-blur-sm bg-white/50">
                        <CardHeader className="space-y-2">
                          <motion.div variants={itemVariants}>
                            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                              Criar Nova Conta
                            </CardTitle>
                          </motion.div>
                          <motion.p
                            variants={itemVariants}
                            className="text-muted-foreground text-center"
                          >
                            Cadastre-se para começar a usar o sistema
                          </motion.p>
                        </CardHeader>
                        <CardContent>
                          <form
                            onSubmit={registerForm.handleSubmit((data) =>
                              registerMutation.mutate({
                                path: 'register',
                                data: data as LoginData
                              })
                            )}
                            className="space-y-6"
                          >
                            <motion.div variants={itemVariants} className="space-y-2">
                              <Label htmlFor="username" className="text-base">
                                Usuário
                              </Label>
                              <div className="relative group">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                <Input
                                  {...registerForm.register("username")}
                                  className="pl-10 h-12 transition-all border-2 group-hover:border-primary"
                                  placeholder="Escolha seu usuário"
                                />
                              </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="space-y-2">
                              <Label htmlFor="password" className="text-base">
                                Senha
                              </Label>
                              <div className="relative group">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                                <Input
                                  type="password"
                                  {...registerForm.register("password")}
                                  className="pl-10 h-12 transition-all border-2 group-hover:border-primary"
                                  placeholder="Escolha sua senha"
                                />
                              </div>
                            </motion.div>

                            <motion.div variants={itemVariants}>
                              <Button
                                type="submit"
                                className="w-full h-12 text-lg transition-all hover:scale-[1.02]"
                                disabled={registerMutation.isPending}
                              >
                                {registerMutation.isPending ? (
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : null}
                                Criar Conta
                              </Button>
                            </motion.div>
                          </form>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>

          {/* Lado Direito - Informações */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <motion.div
                variants={floatingIconVariants}
                animate="animate"
                className="absolute -top-16 -left-8"
              >
                <div className="bg-primary/10 p-4 rounded-2xl">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </motion.div>

              <motion.div
                variants={floatingIconVariants}
                animate="animate"
                transition={{ delay: 1 }}
                className="absolute -bottom-8 -right-8"
              >
                <div className="bg-primary/10 p-4 rounded-2xl">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
              </motion.div>

              <div className="space-y-6 text-center">
                <motion.h1
                  className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  JH Serviços
                </motion.h1>
                <motion.p
                  className="text-xl text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  Sistema profissional para gestão de orçamentos e serviços.
                  Simplifique seu trabalho e aumente sua produtividade.
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
