// src/pages/BlogListing.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  date: string;
  readTime: number;
  preview: string;
  tags: string[];
  mediumLink: string;
}

interface BlogProps {
  // Add any props if needed
}

export function BlogListing({}: BlogProps) {
    const blogPosts: BlogPost[] = [
        {
          id: 'what-is-burner-wallet',
          title: 'What Is a Burner Wallet? Complete Guide for Crypto Users',
          date: 'May 10, 2025',
          readTime: 5,
          preview: 'Discover what a burner wallet is, how it works, and why crypto users are turning to temporary wallets for fast, secure transactions.',
          tags: ['burner wallet', 'temporary crypto wallet'],
          mediumLink: 'https://placeholder.link'
        },
        {
          id: 'create-temporary-crypto-wallet',
          title: 'How to Create a Temporary Crypto Wallet in Minutes with Tempwallets',
          date: 'May 14, 2025',
          readTime: 5,
          preview: 'Learn how to set up a burner wallet quickly with Tempwallets and start managing your crypto assets securely in just minutes.',
          tags: ['create burner wallet', 'tempwallets setup', 'temporary wallet'],
          mediumLink: 'https://placeholder.link'
        },
        {
          id: 'why-use-tempwallets',
          title: 'Why Use Tempwallets? Benefits of a Secure Temporary Wallet',
          date: 'May 18, 2025',
          readTime: 5,
          preview: 'Explore the key benefits of using Tempwallets and understand why secure temporary wallets are gaining popularity among crypto enthusiasts.',
          tags: ['why use burner wallet', 'tempwallets benefits'],
          mediumLink: 'https://placeholder.link'
        },
        {
          id: 'metamask-vs-tempwallets',
          title: 'MetaMask vs Tempwallets: Which Burner Wallet Is Right for You?',
          date: 'May 22, 2025',
          readTime: 5,
          preview: 'Compare MetaMask and Tempwallets to find out which burner wallet suits your crypto needs for speed, security, and convenience.',
          tags: ['metamask burner wallet', 'tempwallets vs metamask'],
          mediumLink: 'https://placeholder.link'
        },
        {
          id: 'protect-nfts-tempwallets',
          title: 'Protect Your NFTs Using Tempwallets Burner Wallet',
          date: 'May 26, 2025',
          readTime: 5,
          preview: 'Find out how Tempwallets burner wallets can help you safeguard your NFTs and manage digital assets with enhanced security.',
          tags: ['burner wallet nft', 'tempwallets nft wallet'],
          mediumLink: 'https://placeholder.link'
        },
        {
          id: 'burner-wallet-address-guide',
          title: 'What Is a Burner Wallet Address and How to Use It Safely',
          date: 'May 30, 2025',
          readTime: 5,
          preview: 'Understand what a burner wallet address is, how it functions, and best practices for using Tempwallets addresses securely.',
          tags: ['burner wallet address', 'tempwallets address'],
          mediumLink: 'https://placeholder.link'
        },
        {
          id: 'burner-wallets-security',
          title: 'Are Burner Wallets Safe? Tempwallets Security Features Explained',
          date: 'Jun 3, 2025',
          readTime: 5,
          preview: 'Dive into the security features of Tempwallets and learn how burner wallets protect your crypto assets from threats.',
          tags: ['burner wallet security', 'tempwallets security'],
          mediumLink: 'https://placeholder.link'
        },
        {
          id: 'install-tempwallets-extension',
          title: 'Step-by-Step Guide to Installing the Tempwallets Browser Extension',
          date: 'Jun 7, 2025',
          readTime: 5,
          preview: 'Follow this easy guide to install the Tempwallets browser extension and start using burner wallets for your crypto transactions.',
          tags: ['burner wallet extension', 'tempwallets extension'],
          mediumLink: 'https://placeholder.link'
        },
        {
          id: 'temporary-vs-hardware-wallet',
          title: 'Temporary Wallet vs Hardware Wallet: When to Use Tempwallets',
          date: 'Jun 11, 2025',
          readTime: 5,
          preview: 'Compare temporary wallets and hardware wallets to decide when Tempwallets is the right choice for your crypto security needs.',
          tags: ['temporary wallet vs hardware wallet', 'burner hardware wallet'],
          mediumLink: 'https://placeholder.link'
        },
      ];

  const handleReadMore = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
    <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            transition: background 0.3s;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          /* Firefox */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
          }
        `}
      </style>
 
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <h1 className="px-6 text-3xl font-bold text-white">Temporary Wallets Demystified: What Every User Should Know</h1>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        <p className="text-center text-gray-400 text-sm">
        Dive into comprehensive guides on burner and temporary crypto wallets for every user needs.
        </p>
      </div>

      {/* Blog Posts Grid */}
      <div className="space-y-6 max-w-4xl mx-auto">
        {blogPosts.map((post) => (
          <article
            key={post.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 
                       hover:border-white/20 hover:bg-white/10 transition-all duration-300 
                       hover:shadow-lg hover:shadow-white/5"
          >
            {/* Post Meta */}
            <div className="flex items-center text-sm text-gray-400 mb-3 space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{post.readTime} min read</span>
              </div>
            </div>

            {/* Post Title */}
            <h2 className="text-xl font-semibold text-white mb-3 hover:text-gray-300 transition-colors">
              {post.title}
            </h2>

            {/* Post Preview */}
            <p className="text-gray-300 mb-4 leading-relaxed">
              {post.preview}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 
                           border border-white/20 hover:border-white/30 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Read More Button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="text-white hover:text-gray-300 hover:bg-white/10 
                         transition-all duration-200 group"
                onClick={() => handleReadMore(post.mediumLink)}
              >
                Read on Medium
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {/* Footer section */}
      <div className="mt-12 pt-8 border-t border-white/10">
        <div className="text-center text-gray-400 text-sm">
          <p>More articles coming soon. Follow us for updates!</p>
        </div>
      </div>
    </div>
    </>
  );
}