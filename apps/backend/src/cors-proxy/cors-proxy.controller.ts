// backend/src/cors-proxy/cors-proxy.controller.ts
import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import axios from 'axios';

@Controller('cors-proxy')
export class CorsProxyController {
  @Get()
  async getProxy(@Query('url') url: string, @Query('authorization') authorization: string, @Res() res: Response) {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: authorization,
        },
      });
      // Stream the response back to the client
      res.status(response.status).send(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Forward the error status and message from the external API
        res.status(error.response.status).send(error.response.data);
      } else {
        // Handle other types of errors
        res.status(500).send({ message: 'Proxy request failed.' });
      }
    }
  }
}