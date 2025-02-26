import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Register() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            })
            if (error) throw error
            router.push('/login')
        } catch (error) {
            console.error('Erro ao registrar:', error)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
            />
            <button type="submit">Registrar</button>
        </form>
    )
} 