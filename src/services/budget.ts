import { supabase } from '@/lib/supabase'

export interface Budget {
  id: number
  title: string
  description: string
  total: number
  created_at: string
  user_id: string
}

export const budgetService = {
  async create(data: Omit<Budget, 'id' | 'created_at' | 'user_id'>) {
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert([data])
      .select()
      .single()

    if (error) throw error
    return budget
  },

  async list() {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async update(id: number, data: Partial<Budget>) {
    const { error } = await supabase
      .from('budgets')
      .update(data)
      .eq('id', id)

    if (error) throw error
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
} 