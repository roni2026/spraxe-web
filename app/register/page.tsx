'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, Loader2, Eye, EyeOff, User } from 'lucide-react';

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // -- GOOGLE AUTH --
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <img 
                  src="https://raw.githubusercontent.com/roni2026/spraxe-web/c10f397a17044cc3a3ec2da08a7456d46c93d73f/public/spraxe.png" 
                  alt="Spraxe Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-blue-900">Create Account</CardTitle>
              <CardDescription>
                Join Spraxe to start your shopping journey
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <RegisterForms 
                onLoading={setIsLoading} 
                isLoading={isLoading} 
                onGoogleLogin={handleGoogleSignIn} 
              />

              <p className="mt-6 text-center text-xs text-gray-500">
                By registering, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-blue-900">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline hover:text-blue-900">
                  Privacy Policy
                </Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// --- SUB-COMPONENT FOR FORM LOGIC ---
function RegisterForms({ onLoading, isLoading, onGoogleLogin }: { onLoading: (v: boolean) => void, isLoading: boolean, onGoogleLogin: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  
  // -- COMMON STATE --
  const [fullName, setFullName] = useState('');

  // -- EMAIL STATE --
  const [emailStep, setEmailStep] = useState<'details' | 'otp'>('details');
  const [showPassword, setShowPassword] = useState(false);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  
  // -- PHONE STATE --
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  // 1. EMAIL SIGN UP HANDLER
  const handleEmailSignUp = async () => {
    if (!fullName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      toast({ title: 'Missing Information', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (signUpPassword.length < 8) {
        toast({ title: 'Weak Password', description: 'Password must be at least 8 characters', variant: 'destructive' });
        return;
    }

    onLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast({ title: 'Account Created', description: `Code sent to ${signUpEmail}` });
        setEmailStep('otp');
      }
    } catch (error: any) {
        // Check for "User already exists" error
        if (
            error.message.includes('already registered') || 
            error.message.includes('already exists') ||
            error.status === 422
        ) {
            toast({ 
                title: 'Account Exists', 
                description: 'You already have an account at Spraxe. Please Sign In.', 
                variant: 'destructive' 
            });
            setTimeout(() => router.push('/login'), 2000); // Redirect to login after 2s
        } else {
            toast({ title: 'Registration Failed', description: error.message, variant: 'destructive' });
        }
    } finally {
      onLoading(false);
    }
  };

  // 1.5 EMAIL VERIFY OTP
  const handleVerifyEmailOTP = async () => {
    if (!emailOtp.trim() || emailOtp.length !== 8) {
        toast({ title: 'Invalid Code', description: 'Enter 8-digit code', variant: 'destructive' });
        return;
    }

    onLoading(true);
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email: signUpEmail,
            token: emailOtp,
            type: 'signup'
        });

        if (error) throw error;

        if (data.user) {
            // FIX: Ensure EMAIL is saved to profiles
            await supabase.from('profiles').upsert({ 
                id: data.user.id, 
                full_name: fullName,
                email: signUpEmail, // <--- Added Email
                role: 'customer'
            });

            toast({ title: 'Success', description: 'Email verified successfully!' });
            router.push('/');
        }
    } catch (error: any) {
        toast({ title: 'Verification Failed', description: error.message, variant: 'destructive' });
    } finally {
        onLoading(false);
    }
  }

  // 2. PHONE OTP SEND
  const handleSendOTP = async () => {
    if (!fullName.trim()) {
        toast({ title: 'Missing Name', description: 'Please enter your full name', variant: 'destructive' });
        return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 11) {
      toast({ title: 'Invalid Phone', description: 'Enter valid 11-digit number', variant: 'destructive' });
      return;
    }

    onLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+88') ? phoneNumber : `+88${phoneNumber}`;
      
      const { error } = await supabase.auth.signInWithOtp({ 
        phone: formattedPhone,
        options: {
            data: { full_name: fullName }
        }
      });

      if (error) throw error;

      toast({ title: 'OTP Sent', description: 'Check your phone for code.' });
      setPhoneStep('otp');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      onLoading(false);
    }
  };

  // 3. PHONE OTP VERIFY
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 8) {
      toast({ title: 'Invalid OTP', description: 'Enter 8-digit code', variant: 'destructive' });
      return;
    }

    onLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+88') ? phoneNumber : `+88${phoneNumber}`;
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user) {
        if (fullName) {
             await supabase.from('profiles')
                .upsert({ 
                    id: data.user.id, 
                    full_name: fullName, 
                    phone: formattedPhone,
                    role: 'customer'
                });
        }
        toast({ title: 'Success', description: 'Account verified successfully' });
        router.push('/');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      onLoading(false);
    }
  };

  return (
    <Tabs defaultValue="phone" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="phone">Phone</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>

      {/* PHONE TAB */}
      <TabsContent value="phone" className="space-y-4">
        {phoneStep === 'phone' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone-name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500">11-digit mobile number</p>
            </div>
            <Button onClick={handleSendOTP} disabled={isLoading || phoneNumber.length < 11} className="w-full bg-blue-900 hover:bg-blue-800">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send OTP'}
            </Button>
          </>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div className="text-center bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-900">Enter code sent to <br/><span className="font-bold">{phoneNumber}</span></p>
             </div>
             <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                placeholder="12345678"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                className="text-center text-xl tracking-widest font-bold"
              />
            </div>
            <Button onClick={handleVerifyOTP} disabled={isLoading} className="w-full bg-blue-900 hover:bg-blue-800">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Register'}
            </Button>
            <Button variant="ghost" onClick={() => setPhoneStep('phone')} className="w-full text-gray-500">
              Change Phone Number
            </Button>
          </div>
        )}
      </TabsContent>

      {/* EMAIL TAB */}
      <TabsContent value="email" className="space-y-4">
        {emailStep === 'details' ? (
           <>
            <div className="space-y-2">
            <Label htmlFor="email-name">Full Name</Label>
            <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                id="email-name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                />
            </div>
            </div>

            <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className="pl-10"
                />
            </div>
            </div>
            <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
                <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailSignUp()}
                />
                <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            <p className="text-xs text-gray-500">Must be at least 8 characters</p>
            </div>
            <Button onClick={handleEmailSignUp} disabled={isLoading} className="w-full bg-blue-900 hover:bg-blue-800">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign Up'}
            </Button>
           </>
        ) : (
            // --- EMAIL OTP UI ---
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="text-center bg-blue-50 p-3 rounded-md">
                   <p className="text-sm text-blue-900">Enter code sent to <br/><span className="font-bold">{signUpEmail}</span></p>
                </div>
                <div className="space-y-2">
                 <Label htmlFor="emailOtp">Verification Code</Label>
                 <Input
                   id="emailOtp"
                   placeholder="12345678"
                   value={emailOtp}
                   onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                   maxLength={8}
                   className="text-center text-xl tracking-widest font-bold"
                 />
               </div>
               <Button onClick={handleVerifyEmailOTP} disabled={isLoading} className="w-full bg-blue-900 hover:bg-blue-800">
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify Email'}
               </Button>
               <Button variant="ghost" onClick={() => setEmailStep('details')} className="w-full text-gray-500">
                 Change Email
               </Button>
             </div>
        )}
        
        {emailStep === 'details' && (
             <div className="text-center text-sm">
                <Link href="/login" className="text-blue-900 hover:underline">
                Already have an account? Sign In
                </Link>
            </div>
        )}
      </TabsContent>

      <div className="relative my-6">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white px-2 text-xs text-gray-500">OR</span>
        </div>
      </div>

      <Button variant="outline" type="button" disabled={isLoading} onClick={onGoogleLogin} className="w-full">
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign Up with Google
      </Button>
    </Tabs>
  );
}
