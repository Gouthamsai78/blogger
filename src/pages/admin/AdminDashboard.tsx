import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, FileText, MessageSquare, TrendingUp, 
  Clock, CheckCircle, XCircle, EyeOff, Eye, Edit, Trash2 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Blog } from '../../lib/supabase';
import { format } from 'date-fns';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [pendingBlogs, setPendingBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogs: 0,
    pendingBlogs: 0,
    totalComments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchPendingBlogs();
      fetchStats();
    }
  }, [profile]);

  const fetchPendingBlogs = async () => {
    const { data } = await supabase
      .from('blogs')
      .select(`
        *,
        profiles:author_id (username, full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    setPendingBlogs(data || []);
  };

  const fetchStats = async () => {
    try {
      const [usersResult, blogsResult, commentsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('blogs').select('id, status', { count: 'exact' }),
        supabase.from('comments').select('id', { count: 'exact', head: true })
      ]);

      const pendingCount = blogsResult.data?.filter(b => b.status === 'pending').length || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalBlogs: blogsResult.count || 0,
        pendingBlogs: pendingCount,
        totalComments: commentsResult.count || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (blogId: string, action: 'approve' | 'reject', feedback?: string) => {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const published_at = action === 'approve' ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('blogs')
      .update({
        status,
        published_at,
        admin_feedback: feedback || ''
      })
      .eq('id', blogId);

    if (!error) {
      fetchPendingBlogs();
      fetchStats();
    }
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage content and moderate submissions.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalBlogs}</div>
                <div className="text-sm text-gray-600">Total Articles</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.pendingBlogs}</div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalComments}</div>
                <div className="text-sm text-gray-600">Total Comments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Moderation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Pending Articles</h2>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : pendingBlogs.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending articles</h3>
              <p className="text-gray-600">All articles have been reviewed.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingBlogs.map((blog) => (
                <div key={blog.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{blog.title}</h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {blog.excerpt || blog.content.substring(0, 200) + '...'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>By {blog.profiles?.username}</span>
                        <span>{format(new Date(blog.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={`/blog/${blog.slug}`}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleModerationAction(blog.id, 'approve')}
                        className="p-2 text-green-600 hover:text-green-700 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const feedback = prompt('Rejection reason (optional):');
                          handleModerationAction(blog.id, 'reject', feedback || undefined);
                        }}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/all-articles"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Manage All Articles</h3>
            <p className="text-sm text-gray-600 mt-1">View, edit, and manage all published articles</p>
          </Link>
          <Link
            to="/admin/users"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage user accounts and permissions</p>
          </Link>
          <Link
            to="/admin/analytics"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">View platform usage and engagement metrics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}