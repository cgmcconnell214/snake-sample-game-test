import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  ArrowDown, 
  ArrowUp, 
  Play, 
  Save,
  Workflow,
  Zap,
  Database,
  MessageSquare,
  Mail,
  Calendar
} from "lucide-react";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  description: string;
  config: any;
  position: number;
}

interface WorkflowEditorProps {
  agent: any;
  onClose: () => void;
  onSave: (workflowData: any) => void;
}

const STEP_TYPES = [
  { value: "trigger", label: "Trigger", icon: Zap, description: "Start the workflow" },
  { value: "action", label: "Action", icon: Play, description: "Perform an action" },
  { value: "condition", label: "Condition", icon: ArrowDown, description: "Make a decision" },
  { value: "data", label: "Data Operation", icon: Database, description: "Process data" },
  { value: "notification", label: "Notification", icon: MessageSquare, description: "Send a message" },
  { value: "email", label: "Email", icon: Mail, description: "Send an email" },
  { value: "schedule", label: "Schedule", icon: Calendar, description: "Schedule an action" },
];

export function WorkflowEditor({ agent, onClose, onSave }: WorkflowEditorProps) {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(
    agent.workflow_data?.steps || []
  );
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [newStepType, setNewStepType] = useState("");

  const addStep = (type: string) => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type,
      name: `New ${type}`,
      description: "",
      config: {},
      position: workflowSteps.length,
    };
    setWorkflowSteps([...workflowSteps, newStep]);
    setEditingStep(newStep);
  };

  const removeStep = (stepId: string) => {
    setWorkflowSteps(workflowSteps.filter(step => step.id !== stepId));
  };

  const moveStep = (stepId: string, direction: "up" | "down") => {
    const stepIndex = workflowSteps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const newSteps = [...workflowSteps];
    const targetIndex = direction === "up" ? stepIndex - 1 : stepIndex + 1;

    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    [newSteps[stepIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[stepIndex]];
    newSteps[stepIndex].position = stepIndex;
    newSteps[targetIndex].position = targetIndex;

    setWorkflowSteps(newSteps);
  };

  const updateStep = (updatedStep: WorkflowStep) => {
    setWorkflowSteps(steps => 
      steps.map(step => step.id === updatedStep.id ? updatedStep : step)
    );
    setEditingStep(null);
  };

  const handleSave = () => {
    const workflowData = {
      steps: workflowSteps,
      metadata: {
        version: "1.0",
        created_at: new Date().toISOString(),
        total_steps: workflowSteps.length,
      },
    };
    onSave(workflowData);
  };

  const getStepIcon = (type: string) => {
    const stepType = STEP_TYPES.find(t => t.value === type);
    const Icon = stepType?.icon || Workflow;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Workflow Editor - {agent.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[70vh]">
          {/* Steps Panel */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Workflow Steps</h3>
              <Select value={newStepType} onValueChange={setNewStepType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add Step" />
                </SelectTrigger>
                <SelectContent>
                  {STEP_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newStepType && (
              <Button
                onClick={() => {
                  addStep(newStepType);
                  setNewStepType("");
                }}
                className="w-full mb-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {STEP_TYPES.find(t => t.value === newStepType)?.label}
              </Button>
            )}

            <ScrollArea className="h-[calc(100%-120px)]">
              <div className="space-y-3">
                {workflowSteps.map((step, index) => (
                  <Card key={step.id} className="cursor-pointer hover:bg-accent/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStepIcon(step.type)}
                          <span className="font-medium">{step.name}</span>
                          <Badge variant="secondary">{step.type}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(step.id, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveStep(step.id, "down")}
                            disabled={index === workflowSteps.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStep(step)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(step.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {step.description && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}

                {workflowSteps.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No workflow steps yet. Add your first step to get started.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Step Editor Panel */}
          {editingStep && (
            <div className="w-80 border-l pl-6">
              <h3 className="text-lg font-semibold mb-4">Edit Step</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="step-name">Step Name</Label>
                  <Input
                    id="step-name"
                    value={editingStep.name}
                    onChange={(e) => setEditingStep({ ...editingStep, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="step-description">Description</Label>
                  <Textarea
                    id="step-description"
                    value={editingStep.description}
                    onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="step-type">Step Type</Label>
                  <Select
                    value={editingStep.type}
                    onValueChange={(value) => setEditingStep({ ...editingStep, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STEP_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step-specific configuration */}
                {editingStep.type === "trigger" && (
                  <div>
                    <Label htmlFor="trigger-event">Trigger Event</Label>
                    <Select
                      value={editingStep.config.event || ""}
                      onValueChange={(value) => 
                        setEditingStep({ 
                          ...editingStep, 
                          config: { ...editingStep.config, event: value }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger event" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="schedule">Scheduled</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="api_call">API Call</SelectItem>
                        <SelectItem value="user_action">User Action</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editingStep.type === "notification" && (
                  <div>
                    <Label htmlFor="notification-message">Message</Label>
                    <Textarea
                      id="notification-message"
                      value={editingStep.config.message || ""}
                      onChange={(e) => 
                        setEditingStep({ 
                          ...editingStep, 
                          config: { ...editingStep.config, message: e.target.value }
                        })
                      }
                      placeholder="Enter notification message..."
                    />
                  </div>
                )}

                {editingStep.type === "email" && (
                  <>
                    <div>
                      <Label htmlFor="email-to">To Email</Label>
                      <Input
                        id="email-to"
                        type="email"
                        value={editingStep.config.to || ""}
                        onChange={(e) => 
                          setEditingStep({ 
                            ...editingStep, 
                            config: { ...editingStep.config, to: e.target.value }
                          })
                        }
                        placeholder="recipient@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-subject">Subject</Label>
                      <Input
                        id="email-subject"
                        value={editingStep.config.subject || ""}
                        onChange={(e) => 
                          setEditingStep({ 
                            ...editingStep, 
                            config: { ...editingStep.config, subject: e.target.value }
                          })
                        }
                        placeholder="Email subject"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => updateStep(editingStep)} className="flex-1">
                    Save Step
                  </Button>
                  <Button variant="outline" onClick={() => setEditingStep(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Workflow className="h-4 w-4" />
            {workflowSteps.length} steps configured
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}