import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form input bindings
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // UI state managers
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple frontend validation guard
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all input fields.");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Post credential request directly to your .NET LoginAsync endpoint
      const response = await axiosInstance.post("users/login", {
        email: email.trim(),
        password: password
      });

      if (response.data && response.data.token) {
        // Feed the extracted JWT token and user metadata object directly to AuthContext
        login(response.data.token, response.data.user);
        
        // Redirect cleanly to your main application dashboard
        navigate("/workspaces");
      } else {
        setError("Invalid authentication package payload returned from service.");
      }
    } catch (err: any) {
      console.error("Authentication Error:", err);
      // Fallback message checks for standard API problem detail payloads
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.title 
        || "Invalid email or password. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Screen Header Content */}
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
            Project Workspace
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your dashboard and assignments
          </p>
        </div>

        {/* Error Alert Modal Bar */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Interactive Authentication Form HTML Element */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            
            {/* Email Field Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
            </div>

          </div>

          {/* Form Processing Form Actions */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;