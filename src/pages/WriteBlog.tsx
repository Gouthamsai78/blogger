import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Save, Send, Image as ImageIcon } from 'lucide-react';
import { RichTextEditor } from '../components/editor/RichTextEditor';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Category } from '../lib/supabase';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  excerpt: yup.string().max(200, 'Excerpt must be less than 200 characters'),
  category_id: yup.string().required('Category is required'),
  featured_image: yup.string().url('Must be a valid URL'),
});

interface BlogForm {
  title: string;
  excerpt: string;
  category_id: string;
  featured_image: string;
}

export function WriteBlog() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError
  } = useForm<BlogForm>({
    resolver: yupResolver(schema)
  });

  const watchedTitle = watch('title');

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    setCategories(data || []);
  };

  const fetchBlog = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .eq('author_id', user?.id)
      .single();

    if (error) {
      navigate('/dashboard');
      return;
    }

    setValue('title', data.title);
    setValue('excerpt', data.excerpt);
    setValue('category_id', data.category_id || '');
    setValue('featured_image', data.featured_image || '');
    setContent(data.content);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const saveDraft = async (formData: BlogForm) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const slug = generateSlug(formData.title);
      const blogData = {
        ...formData,
        content,
        slug,
        author_id: user.id,
        status: 'draft' as const
      };

      if (id) {
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('blogs')
          .insert(blogData)
          .select()
          .single();
        if (error) throw error;
        navigate(`/write/${data.id}`);
      }
    } catch (err) {
      setError('root', { message: 'Failed to save draft' });
    } finally {
      setIsSaving(false);
    }
  };

  const submitForReview = async (formData: BlogForm) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const slug = generateSlug(formData.title);
      const blogData = {
        ...formData,
        content,
        slug,
        author_id: user.id,
        status: 'pending' as const
      };

      if (id) {
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert(blogData);
        if (error) throw error;
      }

      navigate('/dashboard');
    } catch (err) {
      setError('root', { message: 'Failed to submit for review' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = handleSubmit(saveDraft);
  const handleSubmitForReview = handleSubmit(submitForReview);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Article' : 'Write New Article'}
            </h1>
          </div>

          <form className="p-6 space-y-6">
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Article Title
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your article title..."
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
              {watchedTitle && (
                <p className="mt-1 text-sm text-gray-500">
                  Slug: {generateSlug(watchedTitle)}
                </p>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt (Optional)
              </label>
              <textarea
                {...register('excerpt')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your article..."
              />
              {errors.excerpt && (
                <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
              )}
            </div>

            {/* Category and Featured Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  {...register('category_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL (Optional)
                </label>
                <input
                  {...register('featured_image')}
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                {errors.featured_image && (
                  <p className="mt-1 text-sm text-red-600">{errors.featured_image.message}</p>
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Content
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Start writing your article..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center justify-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={isLoading || !content.trim()}
                className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}