import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { registerUser } from "../services/api";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = userId.trim();
    if (!trimmedId) return;
    
    setLoading(true);
    setError(null);
    
    try {

      await registerUser(trimmedId);
      
      navigate("/meetings", { 
        state: { userId: trimmedId },
        replace: true 
      });
    } catch (err: any) {
      setError(err.message || "Failed to register user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-[400px] w-full p-8 rounded-2xl bg-card"
        style={{ boxShadow: "var(--shadow-login)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Meeting Focus</h1>
            <p className="text-sm text-muted-foreground">Enter your user ID to continue</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. 421829fb-3fe6-4fc4-8b2e-c4819b86dc5c"
              className="h-10 w-full px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              required
              disabled={loading}
            />
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Registering..." : "Continue"}
          </motion.button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          🔒 Privacy-first · No screenshots or keystrokes
        </p>
      </motion.div>
    </div>
  );
};

export default Login;