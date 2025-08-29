import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Eye, Heart, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Blog } from '../../lib/supabase';

interface BlogCardProps {
  blog: Blog;
  showStatus?: boolean;
}

export function BlogCard({ blog, showStatus = false }: BlogCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'hidden': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {blog.featured_image && (
        <div className="aspect-video overflow-hidden">
          <img
            src={blog.featured_image}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        {/* Status Badge */}
        {showStatus && (
          <div className="mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
              {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
            </span>
          </div>
        )}

        {/* Category */}
        {blog.categories && (
          <div className="mb-3">
            <Link
              to={`/category/${blog.categories.slug}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {blog.categories.name}
            </Link>
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          <Link to={`/blog/${blog.slug}`} className="line-clamp-2">
            {blog.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {blog.excerpt || blog.content.substring(0, 150) + '...'}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{blog.profiles?.username}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(blog.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{blog.view_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{blog.like_count}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}