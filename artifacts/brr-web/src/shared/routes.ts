import { z } from "zod";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  sales: {
    list: {
      method: 'GET' as const,
      path: '/api/sales',
      responses: {
        200: z.array(z.any()),
      },
    },
    bulkUpdate: {
      method: 'POST' as const,
      path: '/api/sales/bulk',
      input: z.object({
        rows: z.array(z.any()),
        deleteIds: z.array(z.number()).optional(),
      }),
      responses: {
        201: z.array(z.any()),
        400: errorSchemas.validation,
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/sales/submit',
      input: z.object({ date: z.string() }),
      responses: {
        200: z.object({ submittedCount: z.number() }),
        400: z.object({ message: z.string() }),
      },
    },
    isSubmitted: {
      method: 'GET' as const,
      path: '/api/sales/is-submitted',
      responses: {
        200: z.object({ isSubmitted: z.boolean() }),
      },
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: {
        200: z.array(z.any()),
      },
    },
    bulkCreate: {
      method: 'POST' as const,
      path: '/api/orders/bulk',
      input: z.array(z.any()),
      responses: {
        201: z.array(z.any()),
        400: errorSchemas.validation,
      },
    },
  },
  stock: {
    list: {
      method: 'GET' as const,
      path: '/api/stock',
      responses: {
        200: z.array(z.any()),
      },
    },
    bulkUpdate: {
      method: 'POST' as const,
      path: '/api/stock/bulk',
      input: z.array(z.any()),
      responses: {
        201: z.array(z.any()),
        400: errorSchemas.validation,
      },
    },
    sync: {
      method: 'POST' as const,
      path: '/api/stock/sync',
      responses: {
        200: z.object({
          syncedOrderIds: z.array(z.number()),
          updatedStockCount: z.number(),
        }),
      },
    },
  },
  upload: {
    create: {
      method: 'POST' as const,
      path: '/api/upload',
      responses: {
        200: z.object({ message: z.string(), filename: z.string(), orders: z.array(z.any()).optional(), ordersCount: z.number().optional() }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
