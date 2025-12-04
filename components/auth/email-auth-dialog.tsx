'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface EmailAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailAuthDialog({ open, onOpenChange }: EmailAuthDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  
  // Verification State (NEW)
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in with Google.',
        variant: 'destructive',
      });
    }
  };

  const handleSignIn = async () => {
    if (!signInEmail.trim() || !signInPassword.trim()) {
      toast({ title: 'Missing Information', description: 'Please enter email and password', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        toast({ title: 'Success', description: 'Logged in successfully' });
        onOpenChange(false);
        
        if (profile?.role === 'admin') router.push('/admin');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // 1. Modified: Requests the code instead of finishing immediately
  const handleSignUp = async () => {
    if (!signUpEmail.trim() || !signUpPassword.trim() || !signUpFullName.trim()) {
      toast({ title: 'Missing Information', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (signUpPassword.length < 8) {
      toast({ title: 'Weak Password', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          // This ensures we don't auto-confirm if you have that setting on, 
          // and prepares the email to be sent.
          data: {
            full_name: signUpFullName, // We store this metadata for now
          },
        },
      });

      if (error) throw error;

      // SWITCH TO VERIFICATION VIEW
      setIsVerifying(true);
      toast({
        title: 'Check your email',
        description: 'We sent you a verification code.',
      });

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // 2. New: Verifies the code and inserts the profile
 const handleVerify = async () => {
    // CHANGE: Update logic to check for 8 digits
    if (!code || code.length < 8) {
      // CHANGE: Update the error text
      toast({ title: 'Invalid Code', description: 'Please enter the verification code sent to your e-mail.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email: signUpEmail,
        token: code,
        type: 'email', // 'email' type covers signup verification
      });

      if (error) throw error;

      // If verification successful, CREATE PROFILE
      // We do this here because now we have a valid Session
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: signUpFullName,
          role: 'customer',
        });
        
        // Even if profile fails (e.g. already exists), we consider auth a success
        if (profileError) console.error('Profile creation error:', profileError);
      }

      toast({ title: 'Success', description: 'Account verified and logged in!' });
      
      // Cleanup
      onOpenChange(false);
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpFullName('');
      setCode('');
      setIsVerifying(false);

    } catch (error: any) {
      toast({ title: 'Verification Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isVerifying ? 'Verify Email' : 'Email Authentication'}</DialogTitle>
          <DialogDescription>
            {isVerifying 
              ? `Enter the code sent to ${signUpEmail}` 
              : 'Sign in to your account or create a new one'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" value={isVerifying ? 'signup' : undefined} className="w-full">
          {!isVerifying && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          )}

          {/* SIGN IN TAB */}
          <TabsContent value="signin" className="space-y-4">
            <div>
              <Label htmlFor="signin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleSignIn} disabled={loading} className="w-full bg-blue-900 hover:bg-blue-800">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
            </Button>
            
            <div className="relative">
              <Separator className="my-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-xs text-gray-500">OR</span>
              </div>
            </div>
            <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" type="button">
              {/* Google Icon SVG */}
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          </TabsContent>

          {/* SIGN UP TAB */}
          <TabsContent value="signup" className="space-y-4">
            {/* CONDITIONAL RENDERING: SHOW VERIFICATION OR SIGN UP FORM */}
            {isVerifying ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto text-blue-900 mb-2" />
                  <p className="text-sm text-gray-500">
                    We've sent a 6-digit code to <strong>{signUpEmail}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <Button onClick={handleVerify} disabled={loading} className="w-full bg-blue-900 hover:bg-blue-800">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Login'}
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={() => setIsVerifying(false)} 
                  className="w-full text-sm text-gray-500"
                >
                  <ArrowLeft className="mr-2 h-3 w-3" /> Back to Sign Up
                </Button>
              </div>
            ) : (
              // STANDARD SIGN UP FORM
              <>
                <div>
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                </div>

                <Button onClick={handleSignUp} disabled={loading} className="w-full bg-blue-900 hover:bg-blue-800">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                <div className="relative">
                  <Separator className="my-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-2 text-xs text-gray-500">OR</span>
                  </div>
                </div>

                <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" type="button">
                  {/* Google SVG */}
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
