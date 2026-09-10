import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { User, Mail, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Your Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your identity and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                <span className="text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-zinc-900">{user.name}</h3>
                <Badge variant="primary" className="mt-1">{user.role}</Badge>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-border">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 mb-1">
                  <User className="h-4 w-4 text-zinc-400" />
                  Full Name
                </div>
                <p className="text-zinc-600">{user.name}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 mb-1">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  Email Address
                </div>
                <p className="text-zinc-600">{user.email}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 mb-1">
                  <Shield className="h-4 w-4 text-zinc-400" />
                  Account Status
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
