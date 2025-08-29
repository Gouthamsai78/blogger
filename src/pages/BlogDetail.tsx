import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { useBlog } from '../hooks/useBlogs';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { blog, loading } = useBlog(slug!);
  const { comments, addComment } = useComments(blog?.id || '');
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (user && blog) {
      checkIfLiked();
    }
  }, [user, blog]);

  const checkIfLiked = async () => {
    if (!user || !blog) return;

    const { data } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('blog_id', blog.id)
      .eq('user_id', user.id)
      .single();

    setIsLiked(!!data);
  };

  const toggleLike = async () => {
    if (!user || !blog) return;

    if (isLiked) {
      await supabase
        .from('blog_likes')
        .delete()
        .eq('blog_id', blog.id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('blog_likes')
        .insert({
          blog_id: blog.id,
          user_id: user.id
        });
    }

    setIsLiked(!isLiked);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      await addComment(commentText, replyingTo || undefined);
      setCommentText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const renderComment = (comment: any, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            {comment.profiles?.avatar_url ? (
              <img
                src={comment.profiles.avatar_url}
                alt={comment.profiles.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <User className="h-3 w-3" />
            )}
          </div>
          <span className="font-medium text-gray-900">{comment.profiles?.username}</span>
          <span className="text-sm text-gray-500">
            {format(new Date(comment.created_at), 'MMM d, yyyy at h:mm a')}
          </span>
        </div>
        <p className="text-gray-700 mb-2">{comment.content}</p>
        {user && (
          <button
            onClick={() => setReplyingTo(comment.id)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reply
          </button>
        )}
      </div>
      
      {comment.replies?.map((reply: any) => renderComment(reply, depth + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          {/* Category */}
          {blog.categories && (
            <Link
              to={`/category/${blog.categories.slug}`}
              className="inline-block text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
            >
              {blog.categories.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  {blog.profiles?.avatar_url ? (
                    <img
                      src={blog.profiles.avatar_url}
                      alt={blog.profiles.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="font-medium">{blog.profiles?.username}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(blog.published_at || blog.created_at), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{blog.view_count} views</span>
              </div>
            </div>

            {/* Engagement Actions */}
            <div className="flex items-center space-x-4">
              {user && (
                <button
                  onClick={toggleLike}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                    isLiked 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{blog.like_count}</span>
                </button>
              )}
              <button className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Featured Image */}
          {blog.featured_image && (
            <div className="mb-8">
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Author Bio */}
        {blog.profiles && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                {blog.profiles.avatar_url ? (
                  <img
                    src={blog.profiles.avatar_url}
                    alt={blog.profiles.username}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{blog.profiles.full_name}</h3>
                <p className="text-gray-600">@{blog.profiles.username}</p>
                {blog.profiles.bio && (
                  <p className="text-gray-700 mt-2">{blog.profiles.bio}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Comments ({comments.length})
          </h3>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="mb-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Cancel Reply
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post Comment
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
                {' '}to join the conversation
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => renderComment(comment))}
            {comments.length === 0 && (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}