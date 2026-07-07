import { supabase } from '../config/supabase';
import { UserSupabase } from '../types/supabase';
import bcrypt from 'bcryptjs';

export class UserService {
  // Criar novo usuário
  static async createUser(userData: Omit<UserSupabase, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) {
        throw new Error(`Erro ao criar usuário: ${error.message}`);
      }

      return data?.[0];
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  static async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar usuário: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  static async getUserById(id: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar usuário: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  // Atualizar usuário
  static async updateUser(id: string, updates: Partial<UserSupabase>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        throw new Error(`Erro ao atualizar usuário: ${error.message}`);
      }

      return data?.[0];
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Listar todos os usuários (admin)
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        throw new Error(`Erro ao listar usuários: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      throw error;
    }
  }

  // Deletar usuário
  static async deleteUser(id: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao deletar usuário: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      throw error;
    }
  }
}
