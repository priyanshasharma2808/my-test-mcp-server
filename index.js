import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod";
const app = express();
app.use(express.json());

// Create an MCP server
const server = new McpServer({
  name: "Weather data fetcher",
  version: "1.0.0"
});
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
    else if(city.toLowerCase() == 'chandigarh') {
        return { Temp: '32C', Forcast: 'sunny' };   
    }
    else {
        return { Temp: null, Forcast: 'unable to get data' };
    }
}
server.tool('getWeatherDataByCityName', {
    city: z.string()
}, async ({ city }) => {
    return { content: [{ type: "text", text: JSON.stringify(await getWeatherDataByCityName(city)) }] };
}
);

// Map to store transports by session ID
const transports = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'];
  let transport ;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      }
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    

    // ... set up server resources, tools, and prompts ...

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
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

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(3000);





// import { McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
// import { z } from 'zod';
// import express from 'express';
// import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
// const app = express();   
// // Create an MCP server
// const server = new McpServer({
//   name: "Weather data fetcher",
//   version: "1.0.0"
// });

// app.use((req, res, next) => {
//     console.log("Incoming Request:");
//     console.log("URL:", req.url);
//     console.log("Method:", req.method);
//     console.log("Headers:", req.headers);
//     next();
// });

// app.use((req, res, next) => {
//     const originalEnd = res.end;
//     res.end = function (...args) {
//         console.log("Outgoing Response Headers:", res.getHeaders());
//         originalEnd.apply(res, args);
//     };
//     next();
// });

// async function getWeatherDataByCityName(city = '') {
//     if(city.toLowerCase() == 'patiala') {
//         return { Temp: '30C', Forcast: 'rain' };
//     }
//     else if(city.toLowerCase() == 'delhi') {
//         return { Temp: '40C', Forcast: 'wind' };
//     }
//     else if(city.toLowerCase() == 'mumbai') {
//         return { Temp: '35C', Forcast: 'Bohot barish ho rhi hai idhar' };
//     }
//     else {
//         return { Temp: null, Forcast: 'unable to get data' };
//     }
// }

// async function getPinCodeDataByCityName(city = '') {
//     if(city.toLowerCase() == 'hyderabad') {
//         return { Code: '123'};
//     }
//     else if(city.toLowerCase() == 'patna') {
//         return { Code: '445'};
//     }
//     else if(city.toLowerCase() == 'mumbai') {
//         return { Code: '225'};
//     }
//     else if(city.toLowerCase() == 'delhi') {
//         return { Code: '105'};
//     }
//     else {
//         return { Code: null};
//     }
// }

// async function getStateByPincode(code = 0) {
//     if(code == 225) {
//         return { State: 'rajsthan'};
//     }
//     if(code == 105) {
//         return { State: 'bihar'};
//     }
//     else {
//         return { State: null};
//     }
// }

// async function calculateTax(income = 0) {
//     const tax = income <= 500000 ? 0 : (income - 500000) * 0.2;
//     return { tax };
// }

// server.tool('getWeatherDataByCityName', {
//     city: z.string()
// }, async ({ city }, rawInput) => {

//     console.log('Tool called: getWeatherDataByCityName');
//     console.log('Input:', city);
//      console.log('Input:', rawInput); // or c
//     const result = await getWeatherDataByCityName(city);

//     const response = {
//         content: [{ type: "text", text: JSON.stringify(result) }]
//     };

//     console.log('Response (streamed):', response);
//     return response;
// });

// server.tool('getPinCodeDataByCityName', {
//     city: z.string()
// }, async ({ city }, rawInput) => {

//     console.log('Tool called: getPinCodeDataByCityName');
//     console.log('Input:', city);
//     console.log('Input:', rawInput); // or c
//     const result = await getPinCodeDataByCityName(city);

//     const response = {
//         content: [{ type: "text", text: JSON.stringify(result) }]
//     };

//     console.log('Response (streamed):', response);
//     return response;
// }
// );

// server.tool('calculateTax', {
//     income: z.number().min(0)
// }, async ({ income }, rawInput ) => {

//     console.log('Tool called: calculateTax');
//     console.log('Input:', income);
//     console.log('Input:', rawInput); // or c
//     const result = await calculateTax(income);
//     const response = {
//         content: [
//             {
//                 type: "text",
//                 text: JSON.stringify(result)
//             }
//         ]
//     };
//     console.log('Response (streamed):', response);
//     return response;
// });

// server.tool('getStateByPincode', {
//     pincode: z.number().min(0)
// }, async ({ pincode }, rawInput ) => {

//     console.log('Tool called: getStateByPincode');
//     console.log('Input:', pincode);
//     console.log('Input:', rawInput); // or c
//     const result = await getStateByPincode(pincode);
//     const response = {
//         content: [
//             {
//                 type: "text",
//                 text: JSON.stringify(result)
//             }
//         ]
//     };
//     console.log('Response (streamed):', response);
//     return response;
// });

// let transport = null;
// app.get('/sse', (req, res) => {
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     transport = new SSEServerTransport("/messages", res);
//     server.connect(transport);
// });
// app.post('/messages', (req, res) => {
//     if (transport) {
//         transport.handlePostMessage(req, res);
//     } else {
//     res.status(400).json({ error: 'Transport not initialized.' });
//   }
// });
// app.listen(3000);

