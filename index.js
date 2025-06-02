import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod";
// Map to store transports by session ID
const transports = {};

// Create an MCP server
const server = new McpServer({
  name: "Weather data fetcher",
  version: "1.0.0"
});

const app = express();
app.use(express.json());

// log incoming requests and outgoing responses
app.use((req, res, next) => {
    console.log("Incoming Request:");
    console.log("URL:", req.url);
    console.log("Method:", req.method);
    console.log("Headers:", req.headers);
    next();
});

app.use((req, res, next) => {
    const originalEnd = res.end;
    res.end = function (...args) {
        console.log("Outgoing Response Headers:", res.getHeaders());
        originalEnd.apply(res, args);
    };
    next();
});

app.listen(3000);
// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
    console.log('call recived on /mcp url');
    console.log('Request Body:', JSON.stringify(req.body));
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'];
  let transport ;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
    console.log('Reuse existing transport session id');
    console.log('Session ID:', sessionId);
  } else if (!sessionId && isInitializeRequest(req.body)) {
    
    // New initialization request
    console.log('isInitializeRequest called');
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => `FnO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
        console.log('New session initialized with sessionId:', sessionId); 
      }
    });

    // Clean up transport when closed
    transport.onclose = () => {
    
      if (transport.sessionId) {
        console.log('Transport closed for sessionId:', transport.sessionId);
        delete transports[transport.sessionId];
      }
    };
    

    // ... set up server resources, tools, and prompts ...

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    console.log('Invalid request: No valid session ID provided');
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  try {
        // ...existing code...
        await transport.handleRequest(req, res, req.body);
        console.log('Response Status:', res.statusCode);
    } catch (err) {
        console.error('Error handling /mcp request:', err);
        res.status(500).send('Internal Server Error');
    }
});


// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  console.log('call recived on handleSessionRequest');
  console.log('Session ID:', sessionId);

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  try {
        await transport.handleRequest(req, res);
        console.log('Response Status:', res.statusCode);
    } catch (err) {
        console.error('Error handling session request:', err);
        res.status(500).send('Internal Server Error');
    }
};

// Handle GET requests for server-to-client notifications 
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

// functions acting as resource to simulate data fetching for tools
async function getWeatherDataByCityName(city = '') {
    if(city.toLowerCase() == 'patiala') {
        return { Temp: '30C', Forcast: 'rain' };
    }
    else if(city.toLowerCase() == 'delhi') {
        return { Temp: '40C', Forcast: 'wind' };
    }
    else if(city.toLowerCase() == 'mumbai') {
        return { Temp: '35C', Forcast: 'Bohot barish ho rhi hai idhar' };
    }
    else {
        return { Temp: null, Forcast: 'unable to get data' };
    }
}

async function getPinCodeDataByCityName(city = '') {
    if(city.toLowerCase() == 'hyderabad') {
        return { Code: '123'};
    }
    else if(city.toLowerCase() == 'patna') {
        return { Code: '445'};
    }
    else if(city.toLowerCase() == 'mumbai') {
        return { Code: '225'};
    }
    else if(city.toLowerCase() == 'delhi') {
        return { Code: '105'};
    }
    else {
        return { Code: null};
    }
}

async function getStateByPincode(code = 0) {
    if(code == 225) {
        return { State: 'rajsthan'};
    }
    if(code == 105) {
        return { State: 'bihar'};
    }
    else {
        return { State: null};
    }
}

async function calculateTax(income = 0) {
    const tax = income <= 500000 ? 0 : (income - 500000) * 0.2;
    return { tax };
}


// adding functions as tools to the MCP server
server.tool('getWeatherDataByCityName', {
    city: z.string()
}, async ({ city }, rawInput) => {

    console.log('Tool called: getWeatherDataByCityName');
    console.log('Input:', city);
     console.log('Input:', rawInput); // or c
    const result = await getWeatherDataByCityName(city);

    const response = {
        content: [{ type: "text", text: JSON.stringify(result) }]
    };

    console.log('Response (streamed):', response);
    return response;
});

server.tool('getPinCodeDataByCityName', {
    city: z.string()
}, async ({ city }, rawInput) => {

    console.log('Tool called: getPinCodeDataByCityName');
    console.log('Input:', city);
    console.log('Input:', rawInput); // or c
    const result = await getPinCodeDataByCityName(city);

    const response = {
        content: [{ type: "text", text: JSON.stringify(result) }]
    };

    console.log('Response (streamed):', response);
    return response;
}
);

server.tool('calculateTax', {
    income: z.number().min(0)
}, async ({ income }, rawInput ) => {

    console.log('Tool called: calculateTax');
    console.log('Input:', income);
    console.log('Input:', rawInput); // or c
    const result = await calculateTax(income);
    const response = {
        content: [
            {
                type: "text",
                text: JSON.stringify(result)
            }
        ]
    };
    console.log('Response (streamed):', response);
    return response;
});

server.tool('getStateByPincode', {
    pincode: z.number().min(0)
}, async ({ pincode }, rawInput ) => {

    console.log('Tool called: getStateByPincode');
    console.log('Input:', pincode);
    console.log('Input:', rawInput); // or c
    const result = await getStateByPincode(pincode);
    const response = {
        content: [
            {
                type: "text",
                text: JSON.stringify(result)
            }
        ]
    };
    console.log('Response (streamed):', response);
    return response;
});


