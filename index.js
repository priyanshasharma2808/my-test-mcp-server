import { McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());
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

app.get('/stream', async (req, res) => {
  const city = req.query.city;

  if (!city) {
    res.status(400).json({ error: 'City query parameter is required.' });
    return;
  }

  try {
    const data = await getWeatherDataByCityName(city);
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify({ city, data }));
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(3000);