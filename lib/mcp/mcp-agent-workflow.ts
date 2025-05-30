import { MCPConfigFileManager, MCPServerFileConfig } from './mcp-config-file-manager';
import { MCPConfigManager } from './mcp-config-manager';
import { MCPServerManager } from './mcp-server-manager';

export interface MCPSearchResult {
  name: string;
  description: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  source: string;
  confidence: number;
}

export interface MCPInstallResult {
  success: boolean;
  serverName: string;
  message: string;
  tools?: string[];
  error?: string;
}

export interface MCPWorkflowStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  error?: string;
}

export class MCPAgentWorkflow {
  private configFileManager: MCPConfigFileManager;
  private configManager: MCPConfigManager;
  private serverManager: MCPServerManager;
  private steps: MCPWorkflowStep[] = [];

  constructor() {
    this.configFileManager = new MCPConfigFileManager();
    this.configManager = MCPConfigManager.getInstance();
    this.serverManager = MCPServerManager.getInstance();
  }

  /**
   * Install an MCP server based on a natural language request
   */
  async installMCPServer(
    request: string,
    searchResults: MCPSearchResult[],
    onProgress?: (steps: MCPWorkflowStep[]) => void
  ): Promise<MCPInstallResult> {
    this.steps = [];
    
    try {
      // Step 1: Parse the request
      this.addStep('parse_request', 'running', 'Parsing installation request...');
      const serverInfo = this.parseInstallRequest(request, searchResults);
      this.updateStep('parse_request', 'completed', `Identified server: ${serverInfo.name}`);

      // Step 2: Validate configuration
      this.addStep('validate_config', 'running', 'Validating server configuration...');
      const validation = this.configFileManager.validateServerConfig({
        command: serverInfo.command,
        args: serverInfo.args,
        env: serverInfo.env
      });

      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
      this.updateStep('validate_config', 'completed', 'Configuration is valid');

      // Step 3: Check if server already exists
      this.addStep('check_existing', 'running', 'Checking for existing server...');
      const exists = await this.configFileManager.hasServer(serverInfo.name);
      if (exists) {
        this.updateStep('check_existing', 'completed', 'Server already exists, updating configuration');
      } else {
        this.updateStep('check_existing', 'completed', 'No existing server found');
      }

      // Step 4: Backup current configuration
      this.addStep('backup_config', 'running', 'Backing up current configuration...');
      const backupPath = await this.configFileManager.backupConfig();
      this.updateStep('backup_config', 'completed', backupPath ? `Backup created at ${backupPath}` : 'No existing config to backup');

      // Step 5: Add server to configuration file
      this.addStep('add_to_config', 'running', 'Adding server to configuration...');
      await this.configFileManager.addServer(serverInfo.name, {
        command: serverInfo.command,
        args: serverInfo.args,
        env: serverInfo.env
      });
      this.updateStep('add_to_config', 'completed', 'Server added to configuration file');

      // Step 6: Add server to runtime configuration
      this.addStep('add_to_runtime', 'running', 'Adding server to runtime...');
      const serverId = await this.configManager.addServer({
        id: `${serverInfo.name}-${Date.now()}`,
        name: serverInfo.name,
        command: serverInfo.command,
        args: serverInfo.args,
        env: serverInfo.env
      });
      this.updateStep('add_to_runtime', 'completed', 'Server added to runtime configuration');

      // Step 7: Connect to server
      this.addStep('connect_server', 'running', 'Connecting to server...');
      try {
        const server = await this.serverManager.getServer(serverId);
        if (server) {
          await server.connect();
          const tools = await server.getTools();
          const toolNames = tools.map(t => t.name);
          this.updateStep('connect_server', 'completed', `Connected successfully! Found ${toolNames.length} tools`);
          
          // Step 8: Test server
          this.addStep('test_server', 'running', 'Testing server functionality...');
          if (toolNames.length > 0) {
            this.updateStep('test_server', 'completed', `Server is working correctly with tools: ${toolNames.slice(0, 3).join(', ')}${toolNames.length > 3 ? '...' : ''}`);
          } else {
            this.updateStep('test_server', 'completed', 'Server connected but no tools found');
          }

          if (onProgress) onProgress(this.steps);

          return {
            success: true,
            serverName: serverInfo.name,
            message: `Successfully installed ${serverInfo.name} with ${toolNames.length} tools`,
            tools: toolNames
          };
        } else {
          throw new Error('Failed to get server instance');
        }
      } catch (connectError: any) {
        this.updateStep('connect_server', 'failed', `Connection failed: ${connectError.message}`);
        throw connectError;
      }
    } catch (error: any) {
      const failedStep = this.steps.find(s => s.status === 'running');
      if (failedStep) {
        this.updateStep(failedStep.step, 'failed', error.message);
      }

      if (onProgress) onProgress(this.steps);

      return {
        success: false,
        serverName: '',
        message: `Installation failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Remove an MCP server
   */
  async removeMCPServer(serverName: string): Promise<MCPInstallResult> {
    this.steps = [];

    try {
      // Step 1: Check if server exists
      this.addStep('check_server', 'running', 'Checking if server exists...');
      const exists = await this.configFileManager.hasServer(serverName);
      if (!exists) {
        throw new Error(`Server "${serverName}" not found`);
      }
      this.updateStep('check_server', 'completed', 'Server found');

      // Step 2: Disconnect server
      this.addStep('disconnect_server', 'running', 'Disconnecting server...');
      const servers = await this.configManager.getServers();
      const server = servers.find(s => s.name === serverName);
      if (server && server.id) {
        try {
          await this.serverManager.removeServer(server.id);
          this.updateStep('disconnect_server', 'completed', 'Server disconnected');
        } catch (error) {
          this.updateStep('disconnect_server', 'completed', 'Server was not connected');
        }
      } else {
        this.updateStep('disconnect_server', 'completed', 'Server was not running');
      }

      // Step 3: Remove from configuration
      this.addStep('remove_from_config', 'running', 'Removing from configuration...');
      await this.configFileManager.removeServer(serverName);
      this.updateStep('remove_from_config', 'completed', 'Server removed from configuration');

      return {
        success: true,
        serverName,
        message: `Successfully removed ${serverName}`,
      };
    } catch (error: any) {
      const failedStep = this.steps.find(s => s.status === 'running');
      if (failedStep) {
        this.updateStep(failedStep.step, 'failed', error.message);
      }

      return {
        success: false,
        serverName,
        message: `Removal failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Parse install request and search results to determine server configuration
   */
  private parseInstallRequest(request: string, searchResults: MCPSearchResult[]): MCPSearchResult {
    // If we have search results, use the highest confidence one
    if (searchResults.length > 0) {
      const bestResult = searchResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      return bestResult;
    }

    // Otherwise, try to parse from the request directly
    const lowerRequest = request.toLowerCase();
    
    // Check for known official servers
    const officialServers: Record<string, MCPServerFileConfig> = {
      'filesystem': { command: 'npx', args: ['@modelcontextprotocol/server-filesystem'] },
      'github': { command: 'npx', args: ['@modelcontextprotocol/server-github'] },
      'gitlab': { command: 'npx', args: ['@modelcontextprotocol/server-gitlab'] },
      'google-drive': { command: 'npx', args: ['@modelcontextprotocol/server-google-drive'] },
      'postgres': { command: 'npx', args: ['@modelcontextprotocol/server-postgres'] },
      'sqlite': { command: 'npx', args: ['@modelcontextprotocol/server-sqlite'] },
      'puppeteer': { command: 'npx', args: ['@modelcontextprotocol/server-puppeteer'] },
      'brave-search': { command: 'npx', args: ['@modelcontextprotocol/server-brave-search'] },
      'fetch': { command: 'npx', args: ['@modelcontextprotocol/server-fetch'] },
    };

    for (const [name, config] of Object.entries(officialServers)) {
      if (lowerRequest.includes(name)) {
        return {
          name: name.replace('-', '_'),
          description: `Official MCP ${name} server`,
          command: config.command,
          args: config.args,
          source: 'known',
          confidence: 0.9
        };
      }
    }

    // Check for NPX command in request
    const npxMatch = request.match(/npx\s+(@[\w\-\/]+)/);
    if (npxMatch) {
      const packageName = npxMatch[1];
      const serverName = packageName.split('/').pop()?.replace('server-', '') || 'custom';
      return {
        name: serverName,
        description: `MCP server from ${packageName}`,
        command: 'npx',
        args: [packageName],
        source: 'request',
        confidence: 0.8
      };
    }

    throw new Error('Could not determine server configuration from request');
  }

  /**
   * Add a workflow step
   */
  private addStep(step: string, status: MCPWorkflowStep['status'], message?: string) {
    this.steps.push({ step, status, message });
  }

  /**
   * Update a workflow step
   */
  private updateStep(step: string, status: MCPWorkflowStep['status'], message?: string, error?: string) {
    const stepObj = this.steps.find(s => s.step === step);
    if (stepObj) {
      stepObj.status = status;
      if (message) stepObj.message = message;
      if (error) stepObj.error = error;
    }
  }

  /**
   * Get current workflow steps
   */
  getSteps(): MCPWorkflowStep[] {
    return [...this.steps];
  }
}