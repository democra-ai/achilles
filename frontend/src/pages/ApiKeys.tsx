import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  Clock,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "@/store";
import { apiKeysApi } from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const scopeOptions = [
  { key: "read", label: "Read", desc: "View secrets" },
  { key: "write", label: "Write", desc: "Create & update" },
  { key: "admin", label: "Admin", desc: "Full access" },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

export default function ApiKeys() {
  const { apiKeys, setApiKeys, addToast } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read"]);
  const [expiryDays, setExpiryDays] = useState("90");
  const [loading, setLoading] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    apiKeysApi
      .list()
      .then((r) => setApiKeys(r.data))
      .catch(() => {});
  }, [setApiKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiKeysApi.create({
        name,
        scopes: selectedScopes,
        expires_in_days: expiryDays && expiryDays !== "never" ? parseInt(expiryDays) : undefined,
      });
      setNewKeyValue(data.key);
      const list = await apiKeysApi.list();
      setApiKeys(list.data);
      addToast({
        type: "success",
        title: "API key created",
        message: "Remember to copy the key before closing",
      });
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    try {
      await apiKeysApi.revoke(id);
      const { data } = await apiKeysApi.list();
      setApiKeys(data);
      addToast({ type: "success", title: "API key deleted" });
    } catch {
      // handled by interceptor
    }
  };

  const copyKeyValue = async () => {
    if (!newKeyValue) return;
    await navigator.clipboard.writeText(newKeyValue);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  const closeCreate = () => {
    setShowCreate(false);
    setNewKeyValue(null);
    setName("");
    setSelectedScopes(["read"]);
    setExpiryDays("90");
  };

  const parseScopes = (raw: string | string[]): string[] => {
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return null;
    return new Date(ts * 1000).toLocaleDateString();
  };

  const scopeVariant = (scope: string) => {
    switch (scope) {
      case "read":
        return "secondary" as const;
      case "write":
        return "default" as const;
      case "admin":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Access Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage programmatic access to your vault
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          New API Key
        </Button>
      </motion.div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center py-28"
        >
          <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Key className="size-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium">No API keys yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create an API key for programmatic vault access
          </p>
          <Button onClick={() => setShowCreate(true)} className="mt-5">
            <Plus className="size-4" />
            Generate Key
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key, i) => {
            const keyScopes = parseScopes(key.scopes);
            return (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Card className="group">
                  <CardContent className="pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">{key.name}</h3>
                        </div>

                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Shield className="size-3.5 text-muted-foreground" />
                            <div className="flex gap-1">
                              {keyScopes.map((scope) => (
                                <Badge
                                  key={scope}
                                  variant={scopeVariant(scope)}
                                >
                                  {scope}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {key.expires_at && (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="size-3.5" />
                              Expires {formatDate(key.expires_at)}
                            </span>
                          )}
                          {key.last_used_at && (
                            <span className="text-xs text-muted-foreground">
                              Last used {formatDate(key.last_used_at)}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            Created {formatDate(key.created_at)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(key.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && closeCreate()}>
        <DialogContent>
          {newKeyValue ? (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Check className="size-4 text-primary" />
                </div>
                <DialogTitle>API Key Created</DialogTitle>
              </div>

              <Alert className="mb-4">
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  Copy this key now. It won't be shown again.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xs text-primary bg-muted border rounded-lg px-4 py-3 break-all">
                  {newKeyValue}
                </code>
                <Button variant="outline" size="icon" onClick={copyKeyValue}>
                  {copiedKey ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={closeCreate}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>New API Key</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Claude Agent"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scopes</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {scopeOptions.map((scope) => (
                      <Button
                        key={scope.key}
                        type="button"
                        variant={
                          selectedScopes.includes(scope.key)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => toggleScope(scope.key)}
                        className="text-center"
                      >
                        {scope.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Expires In</Label>
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || selectedScopes.length === 0}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Key className="size-4" />
                  )}
                  Generate Key
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
