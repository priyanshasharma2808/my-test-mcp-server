// import { McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
// import { StreamableHTTPServerTransport  } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
// import { z } from 'zod';
// import express from 'express';
// import bodyParser from 'body-parser';

// const app = express();
// app.use(bodyParser.json());
// // Create an MCP server
// const server = new McpServer({
//   name: "Weather data fetcher",
//   version: "1.0.0"
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
//     else if(city.toLowerCase() == 'chandigarh') {
//         return { Temp: '32C', Forcast: 'sunny' };   
//     }
//     else {
//         return { Temp: null, Forcast: 'unable to get data' };
//     }
// }
// server.tool('getWeatherDataByCityName', {
//     city: z.string()
// }, async ({ city }) => {
//     return { content: [{ type: "text", text: JSON.stringify(await getWeatherDataByCityName(city)) }] };
// }
// );

// let transport = null;

// app.get('/stream', (req, res) => {
//   transport = new StreamableHTTPServerTransport("/messages", res);
//   server.connect(transport);
// });

// app.post('/messages', (req, res) => {
//   if (transport) {
//     transport.handlePostMessage(req, res);
//   } else {
//     res.status(400).json({ error: 'Transport not initialized.' });
//   }
// });

// // app.get('/stream', async (req, res) => {
// //   const city = req.query.city;

// //   if (!city) {
// //     res.status(400).json({ error: 'City query parameter is required.' });
// //     return;
// //   }

// //   try {
// //     const data = await getWeatherDataByCityName(city);
// //     res.setHeader('Content-Type', 'application/json');
// //     res.write(JSON.stringify({ city, data }));
// //     res.end();
// //   } catch (error) {
// //     res.status(500).json({ error: 'Internal Server Error' });
// //   }
// // });

// app.listen(3000);


import { McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import express from 'express';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
const app = express();   
// Create an MCP server
const server = new McpServer({
  name: "Weather data fetcher",
  version: "1.0.0"
});

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

let transport = null;
app.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    transport = new SSEServerTransport("/messages", res);
    server.connect(transport);
});
app.post('/messages', (req, res) => {
    if (transport) {
        transport.handlePostMessage(req, res);
    } else {
    res.status(400).json({ error: 'Transport not initialized.' });
  }
});
app.listen(3000);

