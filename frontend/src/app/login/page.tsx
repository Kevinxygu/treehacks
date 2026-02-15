import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-care-gradient flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 p-8 flex flex-col items-center gap-8 animate-in fade-in duration-500">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/images/logo-dark.png" alt="Bloom" width={40} height={40} className="rounded-xl" />
                    <span className="font-semibold text-xl text-gray-900">Bloom</span>
                </Link>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                    <p className="text-gray-500">Sign in to access the caregiver dashboard and agent configuration.</p>
                </div>
                <a
                    href="/auth/login"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-base font-semibold text-white bg-care-blue hover:bg-care-blue/90 transition-colors shadow-lg shadow-care-blue/20"
                >
                    Log in with Auth0
                </a>
                <p className="text-xs text-gray-400 text-center">You will be redirected to Auth0 to sign in securely.</p>
                <Link href="/" className="text-sm text-care-blue hover:underline font-medium">
                    ← Back to home
                </Link>
            </div>
        </div>
    );
}
