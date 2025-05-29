"use client"

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Settings, Image, Server, Upload, Plus, Trash2, Play, Square, FileJson, AlertCircle, CheckCircle2, Loader2, Wrench, Info } from 'lucide-react'
import { useMCPServers } from '@/hooks/mcp/use-mcp-servers'
import { MCPServerConfig } from '@/lib/mcp/mcp-client'
import { MCPJSONParser } from '@/lib/mcp/mcp-json-parser'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Image generation settings
  imageQuality: 'standard' | 'hd'
  onImageQualityChange: (quality: 'standard' | 'hd') => void
  imageStyle: 'vivid' | 'natural'
  onImageStyleChange: (style: 'vivid' | 'natural') => void
  imageSize: '1024x1024' | '1792x1024' | '1024x1792'
  onImageSizeChange: (size: '1024x1024' | '1792x1024' | '1024x1792') => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  imageQuality,
  onImageQualityChange,
  imageStyle,
  onImageStyleChange,
  imageSize,
  onImageSizeChange,
}: SettingsDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('image')
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [manualServerForm, setManualServerForm] = useState({
    name: '',
    command: '',
    args: '',
    env: ''
  })
  
  const {
    servers,
    loading,
    addServer,
    removeServer,
    connectServer,
    disconnectServer,
    getServerTools,
  } = useMCPServers()

  const handleImageQualityChange = (newQuality: 'standard' | 'hd') => {
    onImageQualityChange(newQuality)
    
    const modelName = newQuality === 'hd' ? 'GPT-Image-1' : 'WaveSpeed AI'
    const modelDescription = newQuality === 'hd' 
      ? 'High quality generation with accurate text rendering' 
      : 'Fast image generation with good quality'
    
    toast({
      title: `Switched to ${modelName}`,
      description: modelDescription,
      duration: 3000,
    })
  }

  const handleJSONImport = async () => {
    setIsImporting(true)
    setParseError(null)
    
    try {
      // Use intelligent analysis API
      const response = await fetch('/api/mcp/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: jsonInput, type: 'json' })
      })
      
      const result = await response.json()
      
      if (!result.success || !result.correctedJSON) {
        throw new Error(result.errors?.join('. ') || 'Failed to parse configuration')
      }
      
      // Show suggestions if any
      if (result.suggestions && result.suggestions.length > 0) {
        toast({
          title: "Configuration Notes",
          description: result.suggestions.join('. '),
        })
      }
      
      // Parse the corrected JSON to get servers array
      let servers: any[] = []
      console.log('[Settings] Corrected JSON structure:', result.correctedJSON)
      
      if (Array.isArray(result.correctedJSON)) {
        servers = result.correctedJSON
      } else if (result.correctedJSON.mcpServers) {
        servers = Object.entries(result.correctedJSON.mcpServers).map(([name, cfg]: [string, any]) => ({ name, ...cfg }))
      } else if (result.correctedJSON.servers) {
        servers = result.correctedJSON.servers
      } else {
        // Single server object
        servers = [result.correctedJSON]
      }
      
      console.log('[Settings] Parsed servers:', servers)
      
      if (servers.length === 0) {
        throw new Error('No valid servers found in configuration')
      }
      
      // Add servers and auto-connect them
      let successCount = 0
      const errors: string[] = []
      
      for (const server of servers) {
        try {
          // Ensure server has an ID before adding
          const serverWithId = {
            ...server,
            id: server.id || `server-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          }
          
          console.log('[Settings] Adding server with ID:', serverWithId)
          const addedServer = await addServer(serverWithId)
          
          // Auto-connect the server after adding if it has an ID
          if (addedServer?.id) {
            console.log('[Settings] Connecting to server:', addedServer.id)
            await connectServer(addedServer.id)
          }
          successCount++
        } catch (error) {
          console.error('[Settings] Error adding server:', server, error)
          errors.push(`${server.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      if (successCount > 0) {
        toast({
          title: "✅ Import successful",
          description: `Added and connected ${successCount} MCP server(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
          duration: 5000,
        })
      }
      
      if (errors.length > 0) {
        toast({
          title: "⚠️ Some servers failed",
          description: errors.join('\n'),
          variant: "destructive",
          duration: 8000,
        })
      }
      
      // Clear input on success
      if (successCount > 0) {
        setJsonInput('')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid JSON format"
      setParseError(errorMessage)
      toast({
        title: "❌ Import failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setJsonInput(text)
      toast({
        title: "File loaded",
        description: "Review the configuration and click Import",
      })
    } catch (error) {
      toast({
        title: "Failed to read file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    }
  }

  const handleManualAdd = async () => {
    try {
      const args = manualServerForm.args
        .split('\n')
        .filter(Boolean)
        .map(arg => arg.trim())
        
      const envPairs = manualServerForm.env
        .split('\n')
        .filter(Boolean)
        .map(line => line.trim().split('='))
        .filter(pair => pair.length === 2)
        
      const env = envPairs.reduce((acc, [key, value]) => {
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

      const config: MCPServerConfig = {
        id: `server-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: manualServerForm.name.trim(),
        command: manualServerForm.command.trim(),
        args: args.length > 0 ? args : undefined,
        env: Object.keys(env).length > 0 ? env : undefined,
      }

      await addServer(config)
      
      // Reset form
      setManualServerForm({
        name: '',
        command: '',
        args: '',
        env: ''
      })
      
      toast({
        title: "Server added",
        description: `${config.name} has been added successfully`,
      })
    } catch (error) {
      toast({
        title: "Failed to add server",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2B2B2B] border-[#4A4A4A] text-white max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure image generation and MCP servers
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2 bg-[#1E1E1E]">
            <TabsTrigger value="image" className="data-[state=active]:bg-[#3C3C3C]">
              <Image className="w-4 h-4 mr-2" />
              Image Generation
            </TabsTrigger>
            <TabsTrigger value="mcp" className="data-[state=active]:bg-[#3C3C3C]">
              <Server className="w-4 h-4 mr-2" />
              MCP Servers
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 overflow-y-auto max-h-[50vh]">
            <TabsContent value="image" className="space-y-6">
              {/* Model Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Generation Model</Label>
                <RadioGroup value={imageQuality} onValueChange={(value) => handleImageQualityChange(value as 'standard' | 'hd')}>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-[#3A3A3A] hover:border-[#4A4A4A] transition-colors">
                      <RadioGroupItem value="hd" id="hd" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="hd" className="cursor-pointer">
                          High Quality (GPT-Image-1)
                        </Label>
                        <p className="text-xs text-gray-400 mt-1">
                          OpenAI&apos;s multimodal model • Best quality • Accurate text rendering
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg border border-[#3A3A3A] hover:border-[#4A4A4A] transition-colors">
                      <RadioGroupItem value="standard" id="standard" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="standard" className="cursor-pointer">
                          Standard (WaveSpeed AI)
                        </Label>
                        <p className="text-xs text-gray-400 mt-1">
                          Flux Dev Ultra Fast • Very fast generation • Good quality
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Style Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Style</Label>
                <RadioGroup value={imageStyle} onValueChange={(value) => onImageStyleChange(value as 'vivid' | 'natural')}>
                  <div className="flex gap-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vivid" id="vivid" />
                      <Label htmlFor="vivid" className="cursor-pointer">Vivid</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="natural" id="natural" />
                      <Label htmlFor="natural" className="cursor-pointer">Natural</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Size Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Size</Label>
                <RadioGroup value={imageSize} onValueChange={(value) => onImageSizeChange(value as any)}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1024x1024" id="square" />
                      <Label htmlFor="square" className="cursor-pointer">Square (1024×1024)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1792x1024" id="landscape" />
                      <Label htmlFor="landscape" className="cursor-pointer">Landscape (1792×1024)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1024x1792" id="portrait" />
                      <Label htmlFor="portrait" className="cursor-pointer">Portrait (1024×1792)</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
            
            <TabsContent value="mcp" className="space-y-4">
              {/* Import Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Import MCP Configuration</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="json-input">JSON Configuration</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const examples = MCPJSONParser.getExamples()
                        const exampleFormat = Object.keys(examples)[0]
                        setJsonInput(examples[exampleFormat])
                      }}
                      className="text-xs h-7"
                    >
                      <Info className="w-3 h-3 mr-1" />
                      Show Example
                    </Button>
                  </div>
                  <Textarea
                    id="json-input"
                    placeholder={`Paste any MCP configuration format:
• Claude Desktop format
• Array of servers
• Single server object
• NPX package shortcuts

Supports all standard MCP configuration formats!`}
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value)
                      setParseError(null)
                    }}
                    className={`bg-[#1E1E1E] border-[#3A3A3A] font-mono text-sm h-32 ${parseError ? 'border-red-500' : ''}`}
                  />
                  {parseError && (
                    <Alert className="mt-2 bg-red-500/10 border-red-500/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{parseError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-[#3A3A3A]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Load from File
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleJSONImport}
                      disabled={!jsonInput.trim() || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <FileJson className="w-4 h-4 mr-2" />
                          Import & Connect
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="border-t border-[#3A3A3A] pt-4">
                <h3 className="text-sm font-medium mb-3">Add Server Manually</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="server-name">Name</Label>
                    <Input
                      id="server-name"
                      value={manualServerForm.name}
                      onChange={(e) => setManualServerForm({...manualServerForm, name: e.target.value})}
                      className="bg-[#1E1E1E] border-[#3A3A3A]"
                      placeholder="My MCP Server"
                    />
                  </div>
                  <div>
                    <Label htmlFor="server-command">Command</Label>
                    <Input
                      id="server-command"
                      value={manualServerForm.command}
                      onChange={(e) => setManualServerForm({...manualServerForm, command: e.target.value})}
                      className="bg-[#1E1E1E] border-[#3A3A3A]"
                      placeholder="node server.js"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleManualAdd}
                    disabled={!manualServerForm.name || !manualServerForm.command}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Server
                  </Button>
                </div>
              </div>

              {/* Server List */}
              <div className="border-t border-[#3A3A3A] pt-4">
                <h3 className="text-sm font-medium mb-3">Configured Servers</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {servers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No MCP servers configured</p>
                  ) : (
                    servers.map((server) => {
                      const tools = getServerTools(server.id)
                      const isConnecting = server.status === 'connecting'
                      const isConnected = server.status === 'connected'
                      const hasError = server.status === 'error'
                      
                      return (
                        <Collapsible key={server.id}>
                          <Card className="bg-[#1E1E1E] border-[#3A3A3A] overflow-hidden">
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  {isConnecting ? (
                                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                                  ) : isConnected ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : hasError ? (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <Server className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="font-medium">{server.name}</span>
                                  {isConnected && (
                                    <Badge variant="default" className="text-xs bg-green-600">Connected</Badge>
                                  )}
                                  {isConnecting && (
                                    <Badge variant="secondary" className="text-xs">Connecting...</Badge>
                                  )}
                                  {hasError && (
                                    <Badge variant="destructive" className="text-xs">Error</Badge>
                                  )}
                                  {isConnected && tools.length > 0 && (
                                    <CollapsibleTrigger className="ml-auto mr-2">
                                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-[#3A3A3A]">
                                        <Wrench className="w-3 h-3 mr-1" />
                                        {tools.length} tools
                                      </Badge>
                                    </CollapsibleTrigger>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  {server.status === 'disconnected' || hasError ? (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => connectServer(server.id)}
                                      className="h-7 w-7"
                                      disabled={isConnecting}
                                    >
                                      <Play className="w-3 h-3" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => disconnectServer(server.id)}
                                      className="h-7 w-7"
                                      disabled={isConnecting}
                                    >
                                      <Square className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeServer(server.id)}
                                    className="h-7 w-7 text-red-400 hover:text-red-300"
                                    disabled={isConnecting || isConnected}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {server.command} {server.args?.join(' ') || ''}
                              </p>
                              {server.error && (
                                <p className="text-xs text-red-400 mt-1">{server.error}</p>
                              )}
                            </div>
                            {isConnected && tools.length > 0 && (
                              <CollapsibleContent>
                                <div className="border-t border-[#3A3A3A] bg-[#1A1A1A] px-3 py-2">
                                  <p className="text-xs text-gray-400 mb-2 font-medium">Available Tools:</p>
                                  <div className="grid grid-cols-1 gap-1">
                                    {tools.map((tool) => (
                                      <div key={tool.name} className="text-xs bg-[#2A2A2A] rounded px-2 py-1">
                                        <span className="font-mono text-blue-400">{tool.name}</span>
                                        {tool.description && (
                                          <span className="text-gray-400 ml-2">{tool.description}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            )}
                          </Card>
                        </Collapsible>
                      )
                    })
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)} className="bg-[#4A4A4A] hover:bg-[#5A5A5A]">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}