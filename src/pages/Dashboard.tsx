import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, FileText, Clock, CheckCircle, XCircle, EyeOff, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserBlogs } from '../hooks/useBlogs';
import { format } from 'date-fns';

export function Dashboard() {
  const { profile } = useAuth();
  const { blogs, loading } = useUserBlogs();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'hidden': return <EyeOff className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Published';
      case 'pending': return 'Under Review';
      case 'rejected': return 'Rejected';
      case 'hidden': return 'Hidden';
      default: return 'Draft';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'hidden': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const stats = {
    total: blogs.length,
    drafts: blogs.filter(b => b.status === 'draft').length,
    pending: blogs.filter(b => b.status === 'pending').length,
    published: blogs.filter(b => b.status === 'approved').length,
    totalViews: blogs.reduce((sum, b) => sum + b.view_count, 0),
    totalLikes: blogs.reduce((sum, b) => sum + b.like_count, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || profile?.username}!
          </h1>
          <p className="text-gray-600 mt-2">Manage your articles and track your writing progress.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Articles</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-500">{stats.drafts}</div>
            <div className="text-sm text-gray-600">Drafts</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-pink-600">{stats.totalLikes}</div>
            <div className="text-sm text-gray-600">Total Likes</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            to="/write"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <PenTool className="h-5 w-5 mr-2" />
            Write New Article
          </Link>
          <Link
            to="/profile"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center"
          >
            Edit Profile
          </Link>
        </div>

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Articles</h2>
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
          ) : blogs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600 mb-6">Start writing your first article to share your ideas with the community.</p>
              <Link
                to="/write"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Write Your First Article
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {blogs.map((blog) => (
                <div key={blog.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(blog.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                          {getStatusText(blog.status)}
                        </span>
                        {blog.is_featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow-600 bg-yellow-50">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{blog.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {blog.categories?.name} • Created {format(new Date(blog.created_at), 'MMM d, yyyy')}
                      </p>
                      {blog.admin_feedback && (
                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                          <strong>Admin Feedback:</strong> {blog.admin_feedback}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                        <span>{blog.view_count} views</span>
                        <span>{blog.like_count} likes</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {(blog.status === 'draft' || blog.status === 'rejected') && (
                        <Link
                          to={`/write/${blog.id}`}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      )}
                      {blog.status === 'approved' && (
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}