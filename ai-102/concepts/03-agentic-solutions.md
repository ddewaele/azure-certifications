# Implement an Agentic Solution (5-10%)

This is the **smallest domain** on the AI-102 exam but covers rapidly evolving technology.

## What is an AI Agent?

An AI agent is an AI system that can autonomously plan, reason, use tools, and take actions to accomplish goals. Unlike a simple chatbot that only generates text, an agent can:

- Break complex tasks into subtasks
- Decide which tools to use and when
- Execute code, call APIs, query databases
- Iterate until the goal is achieved
- Maintain state across interactions

### Agent vs Chatbot

| Capability | Chatbot | Agent |
|-----------|---------|-------|
| Text responses | Yes | Yes |
| Multi-step planning | No | Yes |
| Tool use (APIs, code, search) | No | Yes |
| Autonomous decision-making | No | Yes |
| Memory / state | Limited | Yes |
| Self-correction | No | Yes |

## Microsoft Foundry Agent Service

The Microsoft Foundry Agent Service provides a managed platform for building AI agents.

### Key Components

| Component | Description |
|-----------|-------------|
| **Agent** | An AI entity with instructions, a model, and tools |
| **Thread** | A conversation session that maintains message history |
| **Run** | An execution of the agent on a thread |
| **Tool** | A capability the agent can use (code interpreter, file search, function calling) |

### Built-in Tools

| Tool | Description |
|------|-------------|
| **Code Interpreter** | Executes Python code in a sandboxed environment (for calculations, data analysis, charts) |
| **File Search** | Searches through uploaded documents using vector retrieval (RAG) |
| **Function Calling** | Calls developer-defined functions to interact with external systems |
| **Bing Grounding** | Searches the web for up-to-date information |
| **Azure AI Search** | Queries your own search index for grounded responses |

### Creating an Agent

```python
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

client = AIProjectClient(
    credential=DefaultAzureCredential(),
    endpoint="https://<hub>.api.azureml.ms",
    project_name="my-project"
)

agent = client.agents.create_agent(
    model="gpt-4o",
    name="data-analyst",
    instructions="You are a data analyst. Use code interpreter to analyze CSV files.",
    tools=[{"type": "code_interpreter"}]
)

# Create a thread (conversation)
thread = client.agents.create_thread()

# Add a message
client.agents.create_message(
    thread_id=thread.id,
    role="user",
    content="Analyze the sales data in the uploaded file."
)

# Run the agent
run = client.agents.create_and_process_run(
    thread_id=thread.id,
    agent_id=agent.id
)
```

### Function Calling

Define custom functions that the agent can invoke:

```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"}
            },
            "required": ["city"]
        }
    }
}]

agent = client.agents.create_agent(
    model="gpt-4o",
    name="weather-assistant",
    instructions="Help users check the weather.",
    tools=tools
)
```

When the agent decides to call a function, you receive a `requires_action` status. Your code executes the function and submits the result back to the agent.

## Microsoft Agent Framework (Semantic Kernel / AutoGen)

For complex agent scenarios, Microsoft provides frameworks:

### Semantic Kernel

An open-source SDK for building AI agents with:
- **Plugins** — reusable functions the agent can call
- **Planners** — automatically decompose goals into steps
- **Memory** — persistent context across interactions
- **Connectors** — integrate with Azure OpenAI, Hugging Face, etc.

### Multi-Agent Solutions

| Pattern | Description |
|---------|-------------|
| **Orchestrator** | A primary agent coordinates multiple specialist agents |
| **Round-robin** | Agents take turns contributing to the solution |
| **Hierarchical** | Manager agents delegate to worker agents |
| **Collaborative** | Agents discuss and reach consensus |

### Multi-Agent Considerations

- Define clear roles and boundaries for each agent
- Implement guardrails to prevent infinite loops
- Use a shared thread or message bus for inter-agent communication
- Monitor token consumption across all agents
- Implement termination conditions (max iterations, success criteria)

## Testing, Optimizing, and Deploying Agents

### Testing

- **Unit test** individual tools and functions
- **Integration test** the agent end-to-end with sample conversations
- **Evaluation** — measure task completion rate, accuracy, and safety
- **Red teaming** — test for adversarial inputs and edge cases

### Optimization

- Tune the system instructions for clarity and specificity
- Minimise the number of tools to reduce decision complexity
- Use structured output (JSON mode) for predictable responses
- Cache frequently used tool results
- Monitor and limit token consumption per run

### Deployment

- Deploy via Microsoft Foundry as a managed endpoint
- Integrate into applications using the Foundry SDK
- Implement authentication (Entra ID, managed identity)
- Configure rate limiting and quotas
- Enable logging and tracing for debugging

## Exam Tips

- Know the **Agent Service components**: agent, thread, run, tool
- **Code Interpreter** executes Python in a sandbox — useful for calculations and data analysis
- **File Search** uses vector retrieval (RAG) over uploaded documents
- **Function Calling** lets agents interact with external systems — you implement the function logic
- Multi-agent solutions use patterns like **orchestrator** or **hierarchical** delegation
- Agents maintain **state within a thread** — messages persist across runs
- This domain is small (5-10%) but likely to appear as 2-4 scenario questions
- Know when to use **Agent Service** (managed, simple) vs **Semantic Kernel** (complex, custom)
