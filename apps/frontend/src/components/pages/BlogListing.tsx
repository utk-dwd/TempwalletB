// src/pages/BlogListing.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock, Search, X, ChevronDown } from 'lucide-react'; // Removed Newspaper, Added ChevronDown
import { supabase } from '@/lib/supabaseClient'; // Import the Supabase client

/**
 * Defines the structure for a single blog post object,
 * matching the columns in our Supabase table.
 */
interface BlogPost {
  id: string;
  title: string;
  date: string; // Keep as string for display formatting
  read_time_minutes: number;
  preview: string;
  medium_link: string;
}

interface BlogProps {
  // Props can be extended in the future
}

/**
 * A component to display a list of blog articles fetched from Supabase,
 * with a real-time, animated search bar.
 */
export function BlogListing({}: BlogProps) {
  // State for the raw posts fetched from the API
  const [posts, setPosts] = useState<BlogPost[]>([]);
  // State for the posts filtered by the search query
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  // State for the search input value
  const [searchQuery, setSearchQuery] = useState('');
  // State to manage loading and error states for the data fetch
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // =================================================================
  // CHANGE 1: New state to track the ID of the expanded card
  // =================================================================
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);


  // State for the animated search bar
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  /**
   * useEffect hook to fetch blog posts from the Supabase 'posts' table on component mount.
   */
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch data from the 'blogposts' table, ordering by date descending
        const { data, error } = await supabase
          .from('blogposts')
          .select('*')
          .order('date', { ascending: false });

        if (error) {
          throw new Error('Could not fetch blog posts.');
        }

        setPosts(data || []);
        setFilteredPosts(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching posts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  /**
   * useEffect hook to filter blog posts based on the search query.
   */
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const results = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.preview.toLowerCase().includes(query)
    );
    setFilteredPosts(results);
  }, [searchQuery, posts]);

  // Click outside handler for the search bar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);


  const handleReadMore = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };


  const ArticleSkeleton = () => (
    <div className="group bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-6 flex flex-col md:flex-row items-start gap-6 animate-pulse">
      <div className="flex-1 w-full space-y-4">
        {/* Skeleton for the title */}
        <div className="h-5 bg-white/10 rounded w-3/4"></div>
        {/* Skeleton for the metadata */}
        <div className="flex space-x-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="space-y-8">
      <ArticleSkeleton />
      <ArticleSkeleton />
      <ArticleSkeleton />
    </div>
  );
  
  // Helper component for the error state
  const renderErrorState = () => (
    <div className="text-center py-20 bg-red-900/20 border border-red-500/30 rounded-lg">
      <h3 className="text-xl text-red-300 font-semibold">An Error Occurred</h3>
      <p className="text-gray-300 mt-2">{error}</p>
    </div>
  );

  // Helper component for the no results state
  const renderNoResults = () => (
    <div className="text-center py-20">
      <h3 className="text-xl text-white font-semibold">No Articles Found</h3>
      <p className="text-gray-400 mt-2">Try adjusting your search query or check back later.</p>
    </div>
  );

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
        `}
      </style>
 
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
        {/* Header Section */}
        <div className="text-center">
            <span className="text-sm font-semibold text-gray-400 tracking-wider">FAQs & ARTICLES</span>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold text-white">Discover our latest FAQs & articles</h1>
            <p className="mt-4 text-sm max-w-2xl mx-auto text-gray-300">
                TempWallets.com are disposable temporary wallet technology that allow Degens to receive crypto anonymously by generating wallets deterministically from their MetaMask signatures.
            </p>
        </div>

        {/* Centered Animated Search Bar */}
        <div className="my-3 flex justify-center items-center px-4">
          <div 
            ref={searchRef} 
            className="flex items-center justify-end bg-white/5 backdrop-blur-sm rounded-full border border-white/10 shadow-lg transition-all duration-500 ease-in-out"
            style={{ width: isSearchExpanded ? 'clamp(18rem, 60vw, 28rem)' : '3.5rem', height: '3rem' }}
          >
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-full bg-transparent text-white placeholder-gray-300 focus:outline-none transition-opacity duration-300 ${isSearchExpanded ? 'opacity-100 pl-6' : 'opacity-0'}`}
                style={{pointerEvents: isSearchExpanded ? 'auto' : 'none'}}
              />
              <Button 
                variant="ghost" 
                aria-label={isSearchExpanded ? 'Collapse search bar' : 'Expand search bar'}
                className="absolute rounded-full flex-shrink-0 w-14 h-14 text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              >
                {isSearchExpanded ? <X className="h-6 w-6" /> : <Search className="h-6 w-6" />}
              </Button>
          </div>
        </div>

        {/* Blog Posts List - Conditional Rendering */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {isLoading ? renderLoadingState() : 
           error ? renderErrorState() : 
           filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              // Check if the current post is the one that is expanded
              const isExpanded = expandedPostId === post.id;
              
              return (
                <article
                  key={post.id}
                  className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/5"
                >
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    // On click, toggle the expanded state for this specific post
                    onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                  >
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-white group-hover:text-gray-200">
                        {post.title}
                      </h2>
                      <div className="flex items-center text-xs text-gray-400 mt-2 space-x-4">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{post.read_time_minutes} min read</span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`h-6 w-6 text-gray-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
                    />
                  </div>

                  {/* Collapsible Content */}
                  <div 
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {post.preview}
                    </p>
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="ghost"
                        className="text-white hover:text-gray-200 hover:bg-white/10 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent the card from collapsing when the button is clicked
                          handleReadMore(post.medium_link);
                        }}
                      >
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : renderNoResults()}
        </div>
      </div>
    </>
  );
}