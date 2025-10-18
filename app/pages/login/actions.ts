'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { supabase } from '@/utils/supabase/client';
// import { createClient } from '@/utils/supabase/server'

export async function handleSignIn(formData: FormData) {
  // const supabase = await createClient()
  
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  console.log("SIGNING IN...")
  const { error } = await supabase.auth.signInWithPassword(data)
  
  if (error) {
    console.log("FAIL")
    redirect('/error')
  }
  console.log("SUCCESS")

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function handleSignUp(formData: FormData) {
  // const supabase = await createClient()
  
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)
  
  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
