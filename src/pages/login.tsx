import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
    const { signIn } = useAuth()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await signIn(email, password)
            router.push('/dashboard')
        } catch (error) {
            console.error('Erro ao fazer login:', error)
        }
    }

    // Renderize seu formulário de login aqui
} 