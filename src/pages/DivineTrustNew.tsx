import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollText, Plus, FileText, Crown, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface DivineTrustDocument {
  id: string
  title: string
  document_type: string
  content: string
  approval_status: string
  creator_id: string
  approved_by?: string
  approved_at?: string
  created_at: string
}

export default function DivineTrust() {
  const [documents, setDocuments] = useState<DivineTrustDocument[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newDocument, setNewDocument] = useState({
    title: "",
    document_type: "covenant",
    content: "",
    document_data: {}
  })
  const [selectedType, setSelectedType] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('divine_trust_documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch trust documents",
        variant: "destructive"
      })
      return
    }

    setDocuments(data || [])
  }

  const handleCreateDocument = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a document",
        variant: "destructive"
      })
      return
    }

    const { data, error } = await supabase
      .from('divine_trust_documents')
      .insert({
        ...newDocument,
        creator_id: user.id
      })
      .select()
      .single()

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create trust document",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Success",
      description: "Trust document created successfully",
    })

    setDocuments([data, ...documents])
    setIsCreateModalOpen(false)
    setNewDocument({
      title: "",
      document_type: "covenant",
      content: "",
      document_data: {}
    })

    // Create Kingdom Entry record
    await supabase
      .from('kingdom_entry_records')
      .insert({
        user_id: user.id,
        entry_type: 'document_creation',
        entry_data: {
          document_id: data.id,
          document_type: newDocument.document_type,
          title: newDocument.title
        },
        trust_level: 1,
        document_refs: [data.id]
      })
  }

  const handleApproveDocument = async (documentId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('divine_trust_documents')
      .update({
        approval_status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve document",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Success",
      description: "Document approved successfully",
    })

    fetchDocuments()
  }

  const documentTemplates = [
    {
      type: "covenant",
      title: "Sacred Covenant Template",
      content: `SACRED COVENANT OF TRUST

By signing this covenant, I, [NAME], do solemnly swear to uphold the divine principles of trust, transparency, and sacred commerce within this ecosystem.

I pledge to:
1. Act with integrity in all transactions
2. Honor the sacred laws and principles
3. Protect the interests of the trust community
4. Maintain transparency in all dealings
5. Seek wisdom before action

Witnessed this day: [DATE]
Signature: ________________
Trust Level: Initiate`
    },
    {
      type: "agreement",
      title: "Trust Agreement Template",
      content: `DIVINE TRUST AGREEMENT

This agreement establishes the terms of participation in the Sacred Trust ecosystem.

Terms and Conditions:
1. Participation Requirements
2. Rights and Responsibilities
3. Governance Structure
4. Dispute Resolution
5. Sacred Laws Compliance

Effective Date: [DATE]
Trust Hierarchy Level: [LEVEL]`
    }
  ]

  const filteredDocuments = documents.filter(doc => 
    selectedType === "all" || doc.document_type === selectedType
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">Divine Trust Vault</h1>
          <p className="text-muted-foreground">Sacred documents and covenants for trust hierarchy</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Document
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="covenant">Covenants</SelectItem>
            <SelectItem value="agreement">Agreements</SelectItem>
            <SelectItem value="proclamation">Proclamations</SelectItem>
            <SelectItem value="law">Sacred Laws</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  <CardTitle className="text-lg">{document.title}</CardTitle>
                </div>
                <Badge variant={document.approval_status === 'approved' ? 'default' : 'secondary'}>
                  {document.approval_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{document.document_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(document.created_at).toLocaleDateString()}
                  </span>
                </div>
                {document.approved_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="font-medium">
                      {new Date(document.approved_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">
                {document.content.substring(0, 200)}...
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  View Full
                </Button>
                {document.approval_status === 'pending' && (
                  <Button onClick={() => handleApproveDocument(document.id)}>
                    <Crown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <ScrollText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No trust documents found. Create the first one!</p>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Trust Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="e.g., Sacred Covenant of Trust"
                />
              </div>

              <div>
                <Label htmlFor="document_type">Document Type</Label>
                <Select value={newDocument.document_type} onValueChange={(value) => setNewDocument({ ...newDocument, document_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="covenant">Covenant</SelectItem>
                    <SelectItem value="agreement">Agreement</SelectItem>
                    <SelectItem value="proclamation">Proclamation</SelectItem>
                    <SelectItem value="law">Sacred Law</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {documentTemplates.map((template) => (
                    <Button
                      key={template.type}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewDocument({
                        ...newDocument,
                        title: template.title,
                        document_type: template.type,
                        content: template.content
                      })}
                    >
                      Use {template.title}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="content">Document Content</Label>
                <Textarea
                  id="content"
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                  placeholder="Enter the sacred document content..."
                  className="min-h-[300px]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateDocument} className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}