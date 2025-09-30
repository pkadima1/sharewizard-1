/**
 * PartnerApplicationDiagnostic.tsx - Diagnostic Component
 * 
 * Purpose: Debug partner application data and admin authentication
 * Features: Shows raw data, admin status, and collection contents
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, User, Database, Shield, AlertCircle } from 'lucide-react';
import { testAdminAccess } from '@/utils/adminTest';

const PartnerApplicationDiagnostic: React.FC = () => {
  const { currentUser } = useAuth();
  const [partnersData, setPartnersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin check
  const isAdmin = currentUser?.email?.toLowerCase() === 'engageperfect@gmail.com' || 
                  currentUser?.uid === 'admin-uid-here';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const partnersQuery = query(
        collection(db, 'partners'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(partnersQuery);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPartnersData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      active: 0,
      rejected: 0,
      noStatus: 0,
      total: partnersData.length
    };

    partnersData.forEach(partner => {
      if (!partner.status) {
        counts.noStatus++;
      } else if (partner.status === 'active') {
        counts.active++;
      } else if (partner.status === 'pending') {
        counts.pending++;
      } else if (partner.status === 'rejected') {
        counts.rejected++;
      } else {
        counts.noStatus++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Current User: {currentUser?.email || 'Not logged in'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Admin Status: {isAdmin ? '✅ Admin' : '❌ Not Admin'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>User ID: {currentUser?.uid || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Partners Collection Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button onClick={fetchData} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh Data
              </Button>
              <Button onClick={() => testAdminAccess()} variant="outline">
                Test Admin Access
              </Button>
              <span>Total Documents: {partnersData.length}</span>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{statusCounts.noStatus}</div>
                <div className="text-sm text-gray-500">No Status</div>
              </div>
            </div>

            {partnersData.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Sample Documents:</h4>
                {partnersData.slice(0, 3).map((partner, index) => (
                  <div key={partner.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{partner.displayName || 'No Name'}</span>
                      <Badge variant={partner.status === 'pending' ? 'secondary' : partner.status === 'active' ? 'default' : 'destructive'}>
                        {partner.status || 'No Status'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Email: {partner.email || 'No Email'}</div>
                      <div>Created: {partner.createdAt?.toDate?.()?.toLocaleDateString() || 'No Date'}</div>
                      <div>UID: {partner.uid || 'No UID'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {partnersData.length === 0 && !loading && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No documents found in the partners collection. This could mean:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>No partner applications have been submitted</li>
                    <li>Data is stored in a different collection</li>
                    <li>Firestore security rules are blocking access</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerApplicationDiagnostic;
