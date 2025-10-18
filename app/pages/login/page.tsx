"use client"

import { useState } from 'react';
import { handleSignUp , handleSignIn  } from './actions'
import { useAuth } from '@/contexts/auth-context';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  const { user, signIn, signOut } = useAuth()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // const handleSignUp = async () => {
  //   const { user, error } = await supabase.auth.signUp({ email, password });
  //   if (error) console.error('Error signing up:', error);
  //   else console.log('User signed up:', user);
  // };
  
  const handleSignIn = async () => {
    // const { user, error } = await supabase.auth.signIn({ email, password });
    const { user, error } = await signIn(email, password);
    if (error) console.error('Error signing in:', error);
    else console.log('User signed in:', user);
    redirect("/")
  };
  
  return (
    <div>
      <h1>Supabase Authentication</h1>
      <input type="email" onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      {/* <button onClick={handleSignUp}>Sign Up</button> */}
      <button onClick={handleSignIn}>Sign In</button>
    </div>
  );

  // return (
  //   <form>
  //     <label htmlFor="email">Email:</label>
  //     <input id="email" name="email" type="email" required />
  //     <label htmlFor="password">Password:</label>
  //     <input id="password" name="password" type="password" required />
  //     <button formAction={handleSignIn }>Log in</button>
  //     <button formAction={handleSignUp }>Sign up</button>
  //   </form>
  // )
}

/*import { MainLayout } from "@/components/layouts/main-layout"
import { AuthModal } from "@/components/auth/auth-modal"

export default function ChaptersPage() {
  return (
    <MainLayout>
      <AuthModal 
        isOpen={true}
        onOpenChange={(open: boolean) => open}
      />
    </MainLayout>
  )
}*/
