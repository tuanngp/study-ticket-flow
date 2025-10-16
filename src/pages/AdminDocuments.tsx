import { Navbar } from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { DocumentIngestionService, IngestionProgress } from '@/services/documentIngestionService';
import { AlertCircle, CheckCircle, Database, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminDocuments() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<IngestionProgress | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate('/auth');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // Check if user has admin/instructor permissions
      if (!profile || !['instructor', 'admin'].includes(profile.role)) {
        toast.error('Unauthorized access');
        navigate('/dashboard');
        return;
      }

      setUser(profile);
      loadDocuments();
      loadStatistics();
    };

    checkAuth();
  }, [navigate]);

  const loadDocuments = async () => {
    try {
      const docs = await DocumentIngestionService.listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await DocumentIngestionService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Check file type
        const validTypes = ['.txt', '.md'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.'));
        
        if (!validTypes.includes(fileExt)) {
          toast.error(`Invalid file type: ${file.name}. Only .txt and .md files are supported.`);
          continue;
        }

        toast.info(`Processing ${file.name}...`);

        await DocumentIngestionService.processFile(
          file,
          {
            uploaded_by: user.id,
            upload_date: new Date().toISOString(),
            category: 'faq',
            language: 'vi'
          },
          (prog) => setProgress(prog)
        );

        toast.success(`✓ ${file.name} uploaded successfully`);
      }

      // Reload documents and statistics
      await loadDocuments();
      await loadStatistics();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setProgress(null);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteDocument = async (title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await DocumentIngestionService.deleteDocument(title);
      toast.success(`Document "${title}" deleted successfully`);
      await loadDocuments();
      await loadStatistics();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Document Management</h1>
          <p className="text-muted-foreground">
            Manage knowledge base documents for the AI Learning Assistant
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{statistics.totalDocuments}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{statistics.totalChunks}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {(statistics.totalSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Upload .txt or .md files to add to the knowledge base. Files will be automatically
              chunked and embedded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label htmlFor="file-upload">
                  <Button
                    asChild
                    disabled={uploading}
                    className="cursor-pointer"
                  >
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                {documents.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Supported formats: .txt, .md
                  </p>
                )}
              </div>

              {progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{progress.fileName}</span>
                    <span className="text-muted-foreground">
                      {progress.current} / {progress.total} chunks
                    </span>
                  </div>
                  <Progress 
                    value={(progress.current / progress.total) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Upload Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                    <li>Use clear, structured content in Vietnamese or English</li>
                    <li>Include FAQs, regulations, code examples, and guidelines</li>
                    <li>Each file will be automatically chunked (1000 chars per chunk)</li>
                    <li>Embeddings are generated using Gemini AI</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents ({documents.length})</CardTitle>
            <CardDescription>
              Manage existing documents in the knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents uploaded yet</p>
                <p className="text-sm mt-1">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.title}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">{doc.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {doc.chunkCount} chunks
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                          </span>
                          {doc.metadata?.category && (
                            <Badge variant="outline" className="text-xs">
                              {doc.metadata.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDocument(doc.title)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

