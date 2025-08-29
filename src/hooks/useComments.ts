import { useState, useEffect } from 'react';
import { supabase, Comment } from '../lib/supabase';

export function useComments(blogId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (blogId) {
      fetchComments();
    }
  }, [blogId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into a tree structure
      const commentMap = new Map();
      const rootComments: Comment[] = [];

      data?.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
      });

      data?.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies!.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string, parentId?: string) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        blog_id: blogId,
        content,
        parent_id: parentId || null
      })
      .select()
      .single();

    if (error) throw error;
    await fetchComments(); // Refresh comments
    return data;
  };

  return { comments, loading, addComment, refetch: fetchComments };
}