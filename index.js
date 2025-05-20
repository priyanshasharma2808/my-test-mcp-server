import { McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod';
import express from 'express';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();

// Create an MCP server
const server = new McpServer({
  name: "Weather data fetcher",
  version: "1.0.0"
});

async function getWeatherDataByCityName(city = '') {
    if(city.toLowerCase == 'patiala') {
        return { Temp: '30C', Forcast: 'rain' };
    }
    else if(city.toLowerCase == 'delhi') {
        return { Temp: '40C', Forcast: 'wind' };
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

let transport = null;

app.get('/sse', (req, res) => {
    transport = new SSEServerTransport("/messages", res);
    server.connect(transport);
});

app.post('/messages', (req, res) => {
    if (transport) {
        transport.handlePostMessage(req, res);
    }
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/openapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.json'));
});



app.listen(3000);