import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useContractTemplates,
  useContractTemplateVersions,
  useCreateTemplate,
  useUploadTemplateVersion,
  useToggleTemplateActive,
  useDeleteTemplate,
  TEMPLATE_TYPES,
  type ContractTemplate,
} from '@/hooks/useContractTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Plus, Upload, Download, History, Trash2, FileText,
  ChevronRight, Loader2, Search, Eye, EyeOff,
} from 'lucide-react';

function getTypeLabel(value: string) {
  return TEMPLATE_TYPES.find(t => t.value === value)?.label ?? value;
}

export function ContractTemplatesView() {
  const { isAdmin, isOperationsManager, isSalesManager } = useAuth();
  const canManage = isAdmin || isOperationsManager || isSalesManager;
  const canDelete = isAdmin || isOperationsManager;

  const { data: templates = [], isLoading } = useContractTemplates();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyTemplateId, setHistoryTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Create form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('recruitment');
  const [newDesc, setNewDesc] = useState('');
  const createTemplate = useCreateTemplate();

  // Upload form
  const [uploadTemplateId, setUploadTemplateId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const uploadVersion = useUploadTemplateVersion();

  const toggleActive = useToggleTemplateActive();
  const deleteTemplate = useDeleteTemplate();

  // Version history
  const { data: versions = [], isLoading: versionsLoading } = useContractTemplateVersions(historyTemplateId);

  const filtered = useMemo(() => {
    let result = templates;
    if (typeFilter !== 'all') result = result.filter(t => t.template_type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q));
    }
    return result;
  }, [templates, typeFilter, searchQuery]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTemplate.mutate(
      { name: newName.trim(), template_type: newType, description: newDesc.trim() || undefined },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setNewName('');
          setNewType('recruitment');
          setNewDesc('');
        },
      }
    );
  };

  // Fix: proper upload with version detection
  const handleUploadWithVersion = async () => {
    if (!uploadFile || !uploadTemplateId) return;
    const { data } = await (supabase as any)
      .from('contract_template_versions')
      .select('version_number')
      .eq('template_id', uploadTemplateId)
      .order('version_number', { ascending: false })
      .limit(1);
    const nextVersion = (data?.[0]?.version_number ?? 0) + 1;
    uploadVersion.mutate(
      { templateId: uploadTemplateId, file: uploadFile, notes: uploadNotes.trim() || undefined, nextVersion },
      {
        onSuccess: () => {
          setUploadOpen(false);
          setUploadFile(null);
          setUploadNotes('');
          setUploadTemplateId('');
        },
      }
    );
  };

  const handleDownloadVersion = async (storagePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from('contract-documents').download(storagePath);
    if (error || !data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const historyTemplate = templates.find(t => t.id === historyTemplateId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Contract Templates</h2>
          <p className="text-sm text-muted-foreground">Manage Word document templates for different contract types</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(true)} disabled={templates.length === 0}>
              <Upload className="h-4 w-4 mr-2" /> Upload Version
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New Template
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TEMPLATE_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No templates found</p>
                    <p className="text-sm mt-1">Create your first contract template to get started</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(tpl => (
                  <TableRow key={tpl.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{tpl.name}</p>
                        {tpl.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tpl.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{getTypeLabel(tpl.template_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={tpl.is_active}
                            onCheckedChange={val => toggleActive.mutate({ id: tpl.id, is_active: val })}
                            className="scale-90"
                          />
                          <span className="text-xs text-muted-foreground">{tpl.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      ) : (
                        <Badge variant={tpl.is_active ? 'default' : 'secondary'} className="text-xs">
                          {tpl.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(tpl.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadTemplateId(tpl.id);
                            setUploadOpen(true);
                          }}
                          disabled={!canManage}
                          title="Upload new version"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHistoryTemplateId(tpl.id)}
                          title="Version history"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('Delete this template and all its versions?')) {
                                deleteTemplate.mutate(tpl.id);
                              }
                            }}
                            title="Delete template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Contract Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Standard Recruitment Contract" />
            </div>
            <div>
              <Label>Contract Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description of this template..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createTemplate.isPending}>
              {createTemplate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Version Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Template Version</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template</Label>
              <Select value={uploadTemplateId} onValueChange={setUploadTemplateId}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Word Document</Label>
              <Input
                type="file"
                accept=".doc,.docx,.pdf"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: .doc, .docx, .pdf</p>
            </div>
            <div>
              <Label>Version Notes (optional)</Label>
              <Textarea value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} placeholder="What changed in this version..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadWithVersion} disabled={!uploadFile || !uploadTemplateId || uploadVersion.isPending}>
              {uploadVersion.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={!!historyTemplateId} onOpenChange={open => { if (!open) setHistoryTemplateId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History — {historyTemplate?.name}</DialogTitle>
          </DialogHeader>
          {versionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No versions uploaded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Badge variant="secondary">v{v.version_number}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{v.file_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.file_size ? `${(v.file_size / 1024).toFixed(0)} KB` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {v.notes ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(v.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadVersion(v.storage_path, v.file_name)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
