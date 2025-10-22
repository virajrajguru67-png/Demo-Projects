"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Tag,
  Calendar,
  User,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface KnowledgeArticle {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category_name?: string;
  category_color?: string;
  tags: string[];
  author_id: number;
  author_name?: string;
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

export default function KnowledgeBasePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] =
    useState<KnowledgeArticle | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch knowledge base data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return; // Don't fetch if no token

      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        // Fetch articles
        const articlesResponse = await fetch(
          `${apiUrl}/api/tickets/knowledge`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json();
          setArticles(articlesData.articles || []);
        }

        // Fetch categories
        const categoriesResponse = await fetch(
          `${apiUrl}/api/tickets/meta/categories`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData || []);
        }
      } catch (error) {
        console.error("Error fetching knowledge base data:", error);
        toast.error("Failed to load knowledge base");
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      filterCategory === "all" ||
      article.category_id.toString() === filterCategory;

    return matchesSearch && matchesCategory && article.is_published;
  });

  const handleViewArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    // Increment view count
    incrementViewCount(article.id);
  };

  const incrementViewCount = async (articleId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      await fetch(`${apiUrl}/api/tickets/knowledge/${articleId}/view`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const handleFeedback = async (articleId: number, helpful: boolean) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(
        `${apiUrl}/api/tickets/knowledge/${articleId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ helpful }),
        }
      );

      if (response.ok) {
        toast.success("Thank you for your feedback!");
        // Refresh articles to update counts
        window.location.reload();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">
            {authLoading ? "Authenticating..." : "Loading knowledge base..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Knowledge Base
              </h1>
              <p className="text-gray-600">
                Find answers to common questions and solutions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Article</DialogTitle>
                    <DialogDescription>
                      Add a new article to the knowledge base.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateArticleForm
                    categories={categories}
                    onSuccess={() => {
                      setShowCreateDialog(false);
                      window.location.reload();
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Search Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label
                  htmlFor="search"
                  className="text-sm font-medium text-gray-700"
                >
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="category"
                  className="text-sm font-medium text-gray-700"
                >
                  Category
                </Label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("all");
                  }}
                  className="w-full"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewArticle(article)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                      {article.content.substring(0, 100)}...
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Category and Tags */}
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: article.category_color,
                        color: article.category_color,
                      }}
                    >
                      {article.category_name}
                    </Badge>
                    {article.tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {article.view_count}
                      </div>
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {article.helpful_count}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(article.updated_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    {article.author_name}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No articles found
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterCategory !== "all"
                ? "Try adjusting your search criteria"
                : "No articles available in the knowledge base"}
            </p>
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
}

// Create Article Form Component
function CreateArticleForm({
  categories,
  onSuccess,
}: {
  categories: Category[];
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: "",
    tags: [] as string[],
    is_published: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}/api/tickets/knowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
        }),
      });

      if (response.ok) {
        toast.success("Article created successfully!");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create article");
      }
    } catch (error) {
      console.error("Error creating article:", error);
      toast.error("Failed to create article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-sm font-medium text-gray-700">
          Title *
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Article title"
          required
          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <Label htmlFor="content" className="text-sm font-medium text-gray-700">
          Content *
        </Label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="Article content"
          required
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="category"
            className="text-sm font-medium text-gray-700"
          >
            Category *
          </Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) =>
              setFormData({ ...formData, category_id: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
            Tags (comma-separated)
          </Label>
          <Input
            id="tags"
            value={formData.tags.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                tags: e.target.value.split(",").map((tag) => tag.trim()),
              })
            }
            placeholder="tag1, tag2, tag3"
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="published"
          checked={formData.is_published}
          onChange={(e) =>
            setFormData({ ...formData, is_published: e.target.checked })
          }
          className="rounded border-gray-300"
        />
        <Label htmlFor="published" className="text-sm text-gray-700">
          Publish immediately
        </Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Creating..." : "Create Article"}
        </Button>
      </div>
    </form>
  );
}

// Article Detail Modal Component
function ArticleDetailModal({
  article,
  onClose,
  onFeedback,
}: {
  article: KnowledgeArticle;
  onClose: () => void;
  onFeedback: (articleId: number, helpful: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {article.title}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                <div className="flex items-center space-x-4">
                  <span>By {article.author_name}</span>
                  <span>•</span>
                  <span>
                    {new Date(article.updated_at).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{article.view_count} views</span>
                </div>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Category and Tags */}
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                style={{
                  borderColor: article.category_color,
                  color: article.category_color,
                }}
              >
                {article.category_name}
              </Badge>
              {article.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Content */}
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-900">
                {article.content}
              </div>
            </div>

            {/* Feedback Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Was this article helpful?
              </h3>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => onFeedback(article.id, true)}
                  className="flex items-center space-x-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Yes ({article.helpful_count})</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onFeedback(article.id, false)}
                  className="flex items-center space-x-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>No ({article.not_helpful_count})</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
