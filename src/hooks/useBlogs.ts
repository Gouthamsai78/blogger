import { useState, useEffect } from 'react';
import { supabase, Blog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useBlogs(status?: string, limit?: number) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, [status, limit]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id (username, full_name, avatar_url),
          categories:category_id (name, slug)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBlogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { blogs, loading, error, refetch: fetchBlogs };
}

export function useBlog(slug: string) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          profiles:author_id (username, full_name, avatar_url, bio),
          categories:category_id (name, slug)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setBlog(data);

      // Increment view count
      if (data?.status === 'approved') {
        await supabase
          .from('blogs')
          .update({ view_count: data.view_count + 1 })
          .eq('id', data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blog not found');
    } finally {
      setLoading(false);
    }
  };

  return { blog, loading, error, refetch: fetchBlog };
}

export function useUserBlogs() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserBlogs();
    }
  }, [user]);

  const fetchUserBlogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          categories:category_id (name, slug)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (err) {
      console.error('Error fetching user blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  return { blogs, loading, refetch: fetchUserBlogs };
}